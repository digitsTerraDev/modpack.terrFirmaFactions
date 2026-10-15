"""Generate rock, gravel, sand and stone-tool weights; supply instance mods path.

Relative densities are physical; item volumes are gameplay approximations.
Granite block = 2.4 kg. Loose rock = 1/4 block (four rocks craft cobble).
Stone tools retain only a rock category, so use its mean density, not a
particular source rock. Completed tools include an estimated wooden handle.
"""
import argparse
import re
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'config/wfweight/weight_config_modern.yaml'
BEGIN = '    # BEGIN GENERATED STONE WEIGHTS'
END = '    # END GENERATED STONE WEIGHTS'
# Representative bulk densities kg/m3, not mineral grain density. Rock porosity
# and composition vary; these are typical estimates, not exact measurements.
# Sources: https://courses.ems.psu.edu/mng230/node/869
# https://www.geothermie.de/bibliothek/lexikon-der-geothermie/d/dichte
DENSITIES = {
    'granite': 2650, 'diorite': 2900, 'gabbro': 3000,
    'rhyolite': 2500, 'basalt': 2900, 'andesite': 2650,
    'dacite': 2650, 'tuff': 2100,
    'shale': 2600, 'claystone': 2400, 'limestone': 2500,
    'conglomerate': 2500, 'dolomite': 2850, 'chert': 2600, 'chalk': 2000,
    'quartzite': 2700, 'slate': 2750, 'phyllite': 2750,
    'schist': 2700, 'gneiss': 2750, 'marble': 2550,
}
GROUPS = {
    'igneous_intrusive': ['granite', 'diorite', 'gabbro'],
    'igneous_extrusive': ['rhyolite', 'basalt', 'andesite', 'dacite', 'tuff'],
    'sedimentary': ['shale', 'claystone', 'limestone', 'conglomerate', 'dolomite', 'chert', 'chalk'],
    'metamorphic': ['quartzite', 'slate', 'phyllite', 'schist', 'gneiss', 'marble'],
}


def generate(mods):
    items = set()
    for jar in sorted(mods.glob('*.jar')):
        with ZipFile(jar) as archive:
            for name in archive.namelist():
                match = re.fullmatch(r'assets/([^/]+)/models/item/(.+)\.json', name)
                if match:
                    items.add(f'{match[1]}:{match[2]}')
    if 'tfc:rock/raw/granite' not in items:
        raise ValueError('Expected installed TFC models')
    weights = {}
    # Cobble keeps the same solid material mass as raw stone; no reduction
    # for spaces between pieces, which would otherwise lose mass on crafting.
    forms = {'raw': 1, 'hardened': 1, 'smooth': 1, 'cobble': 1,
             'mossy_cobble': 1, 'bricks': 1, 'cracked_bricks': 1,
             'mossy_bricks': 1, 'chiseled': 1,
             'loose': 0.25, 'mossy_loose': 0.25, 'spike': 0.25}
    for rock, density in DENSITIES.items():
        block_kg = 2.4 * density / DENSITIES['granite']
        for form, factor in forms.items():
            for suffix, size in [('', 1), ('_slab', 0.5), ('_stairs', 0.75), ('_wall', 2/3)]:
                item = f'tfc:rock/{form}/{rock}{suffix}'
                if item in items:
                    weights[item] = round(block_kg * factor * size, 6)
        brick = f'tfc:brick/{rock}'
        if brick in items:
            weights[brick] = round(block_kg / 4, 6)
        # Approximate loose gravel packing: 60% solid rock, 40% air.
        # Granite gravel bulk density = 1590 kg/m3, representative dry gravel.
        gravel = f'tfc:rock/gravel/{rock}'
        if gravel in items:
            weights[gravel] = round(block_kg * 0.6, 6)

    # Dry loose sand ~1600 kg/m3; color alone does not establish composition.
    # https://www.cat.com/en_US/articles/ci-articles/earthwork-volumes-reference-tables.html
    sand_kg = round(2.4 * 1600 / DENSITIES['granite'], 6)
    for color in ['black', 'brown', 'yellow', 'white', 'red', 'pink', 'green']:
        item = f'tfc:sand/{color}'
        if item in items:
            weights[item] = sand_kg
    weights['minecraft:sand'] = sand_kg
    weights['minecraft:red_sand'] = sand_kg
    weights['minecraft:gravel'] = round(2.4 * 0.6, 6)

    # Approximate granite-equivalent head masses, plus fixed wood handles.
    tools = {'axe': (0.6, 0.1), 'hammer': (1.2, 0.1), 'hoe': (0.6, 0.1),
             'shovel': (0.6, 0.1), 'knife': (0.15, 0.05), 'javelin': (0.3, 0.2)}
    for group, rocks in GROUPS.items():
        ratio = sum(DENSITIES[r] for r in rocks) / len(rocks) / DENSITIES['granite']
        for tool, (head, handle) in tools.items():
            for suffix, wood in [('_head', 0), ('', handle)]:
                item = f'tfc:stone/{tool}{suffix}/{group}'
                if item in items:
                    weights[item] = round(head * ratio + wood, 6)

    vanilla = {
        'stone': 'granite', 'cobblestone': 'granite', 'mossy_cobblestone': 'granite',
        'smooth_stone': 'granite', 'stone_bricks': 'granite',
        'mossy_stone_bricks': 'granite', 'cracked_stone_bricks': 'granite',
        'chiseled_stone_bricks': 'granite',
        'granite': 'granite', 'polished_granite': 'granite',
        'diorite': 'diorite', 'polished_diorite': 'diorite',
        'andesite': 'andesite', 'polished_andesite': 'andesite',
        'tuff': 'tuff', 'basalt': 'basalt', 'smooth_basalt': 'basalt',
        'polished_basalt': 'basalt', 'calcite': 'limestone',
    }
    for name, rock in vanilla.items():
        weights[f'minecraft:{name}'] = round(2.4 * DENSITIES[rock] / DENSITIES['granite'], 6)
    for tool, (head, handle) in tools.items():
        if tool in ['axe', 'hoe', 'shovel']:
            weights[f'minecraft:stone_{tool}'] = head + handle
    weights['minecraft:stone_pickaxe'] = 0.9 + 0.1
    content = CONFIG.read_text()
    content = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END) + r'\n', '', content, flags=re.S)
    block = BEGIN + '\n    # Typical rock densities; granite block anchor 2.4 kg.\n'
    block += '    # Tool heads use category mean density; handles use fixed estimates.\n'
    block += '    # Dry gravel: 60% rock packing; dry sand: 1600 kg/m3, all colors.\n'
    for rock, density in sorted(DENSITIES.items()):
        block += f'    # {rock}: {density} kg/m3\n'
    block += ''.join(f'    {item}: {kg}\n' for item, kg in sorted(weights.items())) + END + '\n'
    content = content.replace('  exact:\n', '  exact:\n' + block, 1)
    CONFIG.write_text(content, encoding='utf-8')
    print(f'Generated {len(weights)} stone weights across {len(DENSITIES)} rocks.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mods', type=Path)
    generate(parser.parse_args().mods)
