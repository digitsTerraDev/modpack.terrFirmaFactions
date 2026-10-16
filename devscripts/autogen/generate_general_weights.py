"""Generate bulk material, provisions, container and equipment weights.

Usage: python devscripts/generate_general_weights.py INSTANCE_MODS
Bulk material densities are representative; portions and equipment are gameplay
mass estimates. Container rules specify EMPTY shells: Ultimate Weight's native
nested-inventory provider adds recognized contents once. Custom TFC fluid/mold
components are not interpreted here; fill-dependent weights need native support.
Existing metal, wood and stone exact rules always take precedence.
"""
import argparse
import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'config/wfweight/weight_config_modern.yaml'
BEGIN = '    # BEGIN GENERATED GENERAL WEIGHTS'
END = '    # END GENERATED GENERAL WEIGHTS'


def generate(mods):
    items, blocks, tags = set(), set(), {}
    for jar in sorted(mods.glob('*.jar')):
        with ZipFile(jar) as archive:
            for name in archive.namelist():
                match = re.fullmatch(r'assets/([^/]+)/models/item/(.+)\.json', name)
                if match:
                    items.add(f'{match[1]}:{match[2]}')
                match = re.fullmatch(r'assets/([^/]+)/blockstates/(.+)\.json', name)
                if match:
                    blocks.add(f'{match[1]}:{match[2]}')
                match = re.fullmatch(r'data/([^/]+)/tags/item/(.+)\.json', name)
                if match:
                    try:
                        data = json.loads(archive.read(name))
                    except ValueError:
                        continue
                    key = f'{match[1]}:{match[2]}'
                    if data.get('replace'):
                        tags[key] = []
                    tags.setdefault(key, []).extend(data.get('values', []))

    def tag_items(key, seen=frozenset()):
        if key in seen:
            return set()
        out = set()
        for value in tags.get(key, []):
            value = value['id'] if isinstance(value, dict) else value
            if value.startswith('#'):
                out.update(tag_items(value[1:], seen | {key}))
            else:
                out.add(value)
        return out

    content = CONFIG.read_text()
    content = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END) + r'\n', '', content, flags=re.S)
    exact_section = content.split('  exact:\n', 1)[1].split('  wildcards:', 1)[0]
    protected = set(re.findall(r'^    ([^\s#]+): [0-9]', exact_section, re.M))
    weights = {}

    def put(item, kg):
        if item not in protected:
            weights[item] = round(kg, 6)

    # Keep the stone block's effective volume: 2.4 kg / 2650 kg/m3.
    # Soil references: https://www.engineeringtoolbox.com/dirt-mud-densities-d_1727.html
    volume = 2.4 / 2650
    soil_forms = {'dirt': 1220, 'grass': 1220, 'rooted_dirt': 1220,
                  'coarse_dirt': 1220, 'clay': 1600, 'clay_grass': 1600,
                  'clay_duff': 1600, 'hardened_clay': 1600, 'mud': 1840,
                  'mud_bricks': 1800, 'smooth_mud_bricks': 1800}
    for item in sorted(items):
        namespace, name = item.split(':', 1)
        if namespace == 'tfc':
            form = name.split('/')[0]
            if form in soil_forms:
                factor = 0.5 if name.endswith('_slab') else 0.75 if name.endswith('_stairs') else 1
                put(item, soil_forms[form] * volume * factor)
            if name.startswith('mud_brick/'):
                put(item, 1800 * volume / 4)
            if name.startswith('ceramic/'):
                if 'large_vessel' in name:
                    put(item, 3)
                elif 'vessel' in name:
                    put(item, 0.75)
                elif 'jug' in name:
                    put(item, 0.6)
                elif 'pot' in name:
                    put(item, 1.2)
                elif 'brick' in name:
                    put(item, 0.4)
                else:
                    put(item, 0.25)
            match = re.fullmatch(r'wood/(barrel|chest|trapped_chest|crate)/(.+)', name)
            if match:
                from generate_wood_weights import WOODS
                density = WOODS.get(match[2], WOODS['oak'])[0]
                shell = 5 if match[1] == 'barrel' else 2 if match[1] == 'crate' else 3
                put(item, shell * density / WOODS['oak'][0])
        # Species/mod-independent food tags below provide broad coverage;
        # these recipe names refine portions for TFC and its food addons.
        if namespace in ['tfc', 'firmalife', 'survivorsdelight', 'kaleidoscope_cookery',
                         'farmersdelight', 'ktfcc', 'butchercraft'] and name.startswith('food/'):
            kg = 0.25
            if 'berry' in name or 'berries' in name: kg = 0.05
            if any(s in name for s in ['grain', 'flour']): kg = 0.1
            if 'dough' in name: kg = 0.15
            if 'bread' in name: kg = 0.3
            if 'sandwich' in name: kg = 0.4
            if 'salad' in name: kg = 0.5
            if 'soup' in name or 'stew' in name: kg = 0.65
            if any(s in name for s in ['melon', 'pumpkin', 'cabbage']): kg = 1
            put(item, kg)

    for tag, kg in {'c:foods': 0.25, 'c:foods/raw_meat': 0.3,
                    'c:foods/cooked_meat': 0.25, 'c:foods/raw_fish': 0.3,
                    'c:foods/cooked_fish': 0.25, 'c:foods/fruit': 0.2,
                    'c:foods/vegetable': 0.2, 'c:foods/grain': 0.1,
                    'c:leathers': 0.4, 'c:strings': 0.03,
                    'c:dusts/wood': 0.05, 'c:rods/wooden': 0.05}.items():
        for item in tag_items(tag):
            if item not in weights:
                put(item, kg)
    for tag, kg in {'c:foods/raw_meat': 0.3, 'c:foods/cooked_meat': 0.25,
                    'c:foods/raw_fish': 0.3, 'c:foods/cooked_fish': 0.25,
                    'c:foods/flour': 0.1, 'c:foods/dough': 0.15,
                    'c:foods/bread': 0.3, 'c:foods/sandwiches': 0.4,
                    'c:foods/salad': 0.5, 'c:foods/soup': 0.65,
                    'c:rubber': 0.15, 'c:rubbers': 0.15,
                    'c:ropes': 0.3, 'c:papers': 0.01,
                    'minecraft:swords': 2, 'minecraft:axes': 1.5,
                    'c:tools/shield': 5, 'c:tools/bow': 0.8,
                    'c:tools/crossbow': 2}.items():
        for item in tag_items(tag):
            put(item, kg)

    explicit = {
        'minecraft:coal': 0.25, 'minecraft:charcoal': 0.1,
        'minecraft:coal_block': 2.25, 'immersiveengineering:coal_coke': 0.2,
        'immersiveengineering:coke': 1.8, 'immersiveengineering:dust_coke': 0.2,
        'tfc:ore/lignite': 0.2, 'tfc:ore/bituminous_coal': 0.25,
        'tfc:peat': volume * 600, 'tfc:peat_grass': volume * 600,
        'minecraft:dirt': volume * 1220, 'minecraft:grass_block': volume * 1220,
        'minecraft:coarse_dirt': volume * 1220, 'minecraft:rooted_dirt': volume * 1220,
        'minecraft:mud': volume * 1840, 'minecraft:clay': volume * 1600,
        'minecraft:clay_ball': 0.35, 'tfc:fire_clay': 0.35,
        'tfc:kaolin_clay': 0.35, 'minecraft:brick': 0.4,
        'minecraft:bricks': 1.6, 'minecraft:terracotta': volume * 1800,
        'minecraft:glass': volume * 2500, 'minecraft:glass_pane': volume * 2500 * 6/16,
        'minecraft:paper': 0.01, 'minecraft:book': 0.3,
        'minecraft:leather': 0.4, 'minecraft:string': 0.03,
        'minecraft:bucket': 0.75, 'minecraft:glass_bottle': 0.15,
        'minecraft:potion': 0.4, 'minecraft:splash_potion': 0.4,
        'minecraft:lingering_potion': 0.4, 'minecraft:honey_bottle': 0.5,
        'minecraft:milk_bucket': 1.78, 'minecraft:powder_snow_bucket': 1.05,
        'minecraft:chest': 3, 'minecraft:trapped_chest': 3,
        'minecraft:barrel': 5, 'minecraft:shulker_box': 2,
        'minecraft:bundle': 0.2, 'minecraft:bowl': 0.1,
        'minecraft:bread': 0.3, 'minecraft:apple': 0.2,
        'minecraft:beef': 0.3, 'minecraft:cooked_beef': 0.25,
        'minecraft:arrow': 0.03, 'minecraft:bow': 0.8, 'minecraft:crossbow': 2,
        'tfc:burlap_cloth': 0.2, 'tfc:wool_cloth': 0.2, 'tfc:silk_cloth': 0.1,
        'tfc:wool': 0.15, 'tfc:jute_fiber': 0.05, 'tfc:glue': 0.1,
        'tfc:powder/wood_ash': 0.05, 'tfc:powder/compost': 0.1,
        'immersiveengineering:fertilizer': 0.1, 'create:tree_fertilizer': 0.1,
        'immersiveengineering:hemp_fabric': 0.2, 'immersiveengineering:hemp_fiber': 0.05,
        'create:belt_connector': 1, 'create:shaft': 0.75,
        'create:cogwheel': 0.5, 'create:large_cogwheel': 1,
        'create:andesite_casing': 4, 'create:brass_casing': 5,
        'create:copper_casing': 5, 'create:railway_casing': 6,
        'create:steam_engine': 15, 'create:mechanical_press': 20,
        'create:mechanical_mixer': 15, 'create:mechanical_drill': 12,
        'create:mechanical_saw': 12, 'create:crushing_wheel': 30,
        'create:millstone': 15, 'create:depot': 4, 'create:basin': 6,
        'create:spout': 4, 'create:fluid_tank': 8, 'create:fluid_pipe': 1,
        'create:mechanical_pump': 6, 'create:water_wheel': 12,
        'create:large_water_wheel': 25, 'create:windmill_bearing': 8,
        'immersiveengineering:light_engineering': 15,
        'immersiveengineering:heavy_engineering': 30,
        'immersiveengineering:rs_engineering': 10,
        'siegeworks:rope': 0.3, 'siegeworks:cannon_ball': 6,
        'siegeworks:giant_cannon_ball': 30, 'siegeworks:grapeshot': 3,
        'siegeworks:black_powder': 0.1, 'siegeworks:arcballista_bolt': 1,
        'siegeworks:tower_crossbow_bolt': 0.5, 'siegeworks:fire_arrow': 0.05,
        'siegeworks:wheel': 8, 'siegeworks:ramrod': 2,
        'terra:hardtack_sandwich': 0.4,
    }
    for name, kg in explicit.items():
        if name.startswith('minecraft:') or name in items or name == 'terra:hardtack_sandwich':
            put(name, kg)
    for item in sorted(items):
        ns, name = item.split(':', 1)
        if ('rubber' in name and item not in blocks
                and not any(s in name for s in ['boot', 'helmet', 'armor', 'leggings'])):
            put(item, 0.15)
        if ns == 'minecraft' and name.endswith('_stained_glass'):
            put(item, volume * 2500)
        if ns == 'minecraft' and name.endswith('_stained_glass_pane'):
            put(item, volume * 2500 * 6/16)
        if ns == 'minecraft' and name.endswith('_wool'):
            put(item, 0.6)
        if ns == 'minecraft' and name.endswith('_carpet'):
            put(item, 0.2)
        if ns == 'siegeworks' and name.endswith('_spawner'):
            put(item, 180 if any(s in name for s in ['tower', 'trebuchet', 'mons_meg']) else 60)
        if ns == 'create' and item in blocks and item not in weights:
            put(item, 8)  # configurable baseline for remaining machinery
        if ns == 'immersiveengineering' and item in blocks and item not in weights:
            put(item, 12)
        if ns == 'tfc' and name.startswith('metal/anvil/'):
            # Metal generator already derives actual metal yield: do not override.
            continue
    for metal in ['alexandriite', 'byzantium', 'vitalum', 'mugenium', 'antinomia', 'vutironium', 'durallium']:
        put(f'terra:{metal}_refinery', 25)
    # Estimated empty cart mass, split into oak-equivalent wood and hardware.
    # Only installed TFC species; skip optional AFC variants without a density.
    from generate_wood_weights import WOODS
    cart_parts = {'wheel': (5, 0), 'hand_cart': (18, 2),
                  'supply_cart': (30, 5), 'animal_cart': (40, 5),
                  'plow': (20, 5), 'reaper': (35, 10), 'seed_drill': (35, 15)}
    for item in sorted(items):
        match = re.fullmatch(r'tfcastikorcarts:([^/]+)/([^/]+)', item)
        if match and match[1] in cart_parts and match[2] in WOODS:
            wood_kg, hardware_kg = cart_parts[match[1]]
            put(item, wood_kg * WOODS[match[2]][0] / WOODS['oak'][0] + hardware_kg)
    block = BEGIN + '\n'
    block += '    # Bulk densities are representative; portions/machines are mass estimates.\n'
    block += '    # Containers: empty shells only; native nested provider adds supported contents.\n'
    block += '    # TFC custom fluid/mold contents still require native compatibility.\n'
    block += ''.join(f'    {item}: {kg}\n' for item, kg in sorted(weights.items())) + END + '\n'
    CONFIG.write_text(content.replace('  exact:\n', '  exact:\n' + block, 1), encoding='utf-8')
    print(f'Generated {len(weights)} general weights.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mods', type=Path)
    generate(parser.parse_args().mods)
