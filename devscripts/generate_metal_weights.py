"""Generate Ultimate Weight rules from installed TFC heating recipes.

Usage: python devscripts/generate_metal_weights.py PATH_TO_INSTANCE_MODS
Run again after updating mods or their melting recipes. No external packages required.
Weights represent full, unworn items; the weight mod's static rules cannot scale
with tool durability. Ore mass includes gangue rather than just recoverable metal.
"""
import argparse
import json
import re
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'config/wfweight/weight_config_modern.yaml'
BEGIN = '    # BEGIN GENERATED METAL AND ORE WEIGHTS'
END = '    # END GENERATED METAL AND ORE WEIGHTS'
# Room-temperature densities in g/cm3, using RSC elemental values:
# https://periodic-table.rsc.org/element/29/copper (and each element's page).
# Iron alloy values are representative engineering approximations, not exact
# measurements of TFC's fictional steels. Equal TFC units represent equal volume.
# Keep 100 units of copper at 0.85 kg; scale everything else by density / 8.96.
DENSITY = {
    'copper': 8.96, 'gold': 19.3, 'silver': 10.5, 'bismuth': 9.79,
    'tin': 7.287, 'zinc': 7.134, 'nickel': 8.90, 'iron': 7.87,
    'aluminum': 2.70, 'uranium': 19.1, 'lead': 11.3, 'chromium': 7.15,
    'cast_iron': 7.2, 'pig_iron': 7.2, 'wrought_iron': 7.7, 'steel': 7.85,
    'high_carbon_steel': 7.85, 'unknown': 7.85,
}
FORGEABLE = ['copper', 'bronze', 'bismuth_bronze', 'black_bronze',
             'wrought_iron', 'steel', 'black_steel', 'red_steel', 'blue_steel']


def generate(mods):
    recipes, tags = {}, {}
    ore_items = set()

    def ingest(name, data):
        match = re.fullmatch(r'data/([^/]+)/recipe/(.+)\.json', name)
        if match:
            recipes[f'{match[1]}:{match[2]}'] = data
        match = re.fullmatch(r'data/([^/]+)/tags/item/(.+)\.json', name)
        if match:
            key = f'{match[1]}:{match[2]}'
            if data.get('replace'):
                tags[key] = []
            tags.setdefault(key, []).extend(data.get('values', []))

    jars = sorted(mods.glob('*.jar'))
    if not any(p.name.startswith('TerraFirmaCraft-NeoForge') for p in jars):
        raise ValueError('Expected an installed TerraFirmaCraft jar in the mods directory')
    for jar in jars:
        with ZipFile(jar) as archive:
            for name in archive.namelist():
                ore_model = re.fullmatch(r'assets/tfc/models/item/(ore/.+)\.json', name)
                if ore_model:
                    ore_items.add('tfc:' + ore_model[1])
                if name.startswith('data/') and name.endswith('.json') and (
                        '/recipe/' in name or '/tags/item/' in name):
                    try:
                        ingest(name, json.loads(archive.read(name)))
                    except (ValueError, UnicodeDecodeError):
                        continue
    # Local packs override bundled recipes and contribute item tags.
    for root in [ROOT / 'kubejs', *sorted((ROOT / 'datapacks').iterdir())]:
        if not root.is_dir():
            continue
        for path in sorted((root / 'data').rglob('*.json')):
            ingest(path.relative_to(root).as_posix(), json.loads(path.read_text(encoding='utf-8-sig')))

    def tag_items(key, visiting=frozenset()):
        if key in visiting:
            return set()
        result = set()
        for value in tags.get(key, []):
            value = value['id'] if isinstance(value, dict) else value
            if value.startswith('#'):
                result.update(tag_items(value[1:], visiting | {key}))
            else:
                result.add(value)
        return result

    def items(ingredient):
        if isinstance(ingredient, list):
            return set().union(*(items(i) for i in ingredient))
        if 'item' in ingredient:
            return {ingredient['item']}
        if 'tag' in ingredient:
            return tag_items(ingredient['tag'])
        raise ValueError(f'Unsupported metal ingredient: {ingredient}')

    # TFC alloy fractions are fluid volumes. Use normalized midpoint recipes
    # and additive component volumes as a reproducible density approximation.
    densities = dict(DENSITY)
    aliases = {
        'black_steel': 'weak_steel', 'red_steel': 'weak_red_steel',
        'blue_steel': 'weak_blue_steel',
        'high_carbon_black_steel': 'black_steel',
        'high_carbon_red_steel': 'red_steel',
        'high_carbon_blue_steel': 'blue_steel',
    }
    pending = [r for r in recipes.values() if r.get('type') == 'tfc:alloy'
               and ':metal/' in r.get('result', '')]
    while pending or aliases:
        progress = False
        for recipe in pending[:]:
            components = [(c['fluid'].split('/')[-1], (c['min'] + c['max']) / 2)
                          for c in recipe['contents']]
            if all(metal in densities for metal, fraction in components):
                total = sum(fraction for metal, fraction in components)
                densities[recipe['result'].split('/')[-1]] = sum(
                    densities[metal] * fraction for metal, fraction in components) / total
                pending.remove(recipe)
                progress = True
        for metal, source in list(aliases.items()):
            if source in densities:
                densities[metal] = densities[source]
                del aliases[metal]
                progress = True
        if not progress:
            raise ValueError(f'Unresolved alloy densities: {pending}, {aliases}')
    ingot_kg = {metal: density * 0.85 / densities['copper']
                for metal, density in densities.items()}
    weights = {}
    tag_weights = {}
    conflicts = []
    for recipe_id, recipe in sorted(recipes.items()):
        fluid = recipe.get('result_fluid', {})
        if recipe.get('type') != 'tfc:heating' or ':metal/' not in fluid.get('id', ''):
            continue
        metal = fluid['id'].split('/')[-1]
        if metal not in ingot_kg:
            raise ValueError(f'Add ingot weight for {metal}: {recipe_id}')
        weight = round(fluid['amount'] / 100 * ingot_kg[metal], 6)
        ingredient = recipe['ingredient']
        if isinstance(ingredient, dict) and 'tag' in ingredient:
            tag_weights[ingredient['tag']] = weight
        for item in items(ingredient):
            if item in weights and weights[item] != weight:
                conflicts.append((item, weights[item], weight, recipe_id))
            weights[item] = weight
    if conflicts:
        raise ValueError(f'Conflicting melting yields: {conflicts}')

    # Explicit KubeJS melting overrides in frost/metal_properties.js.
    for metal in FORGEABLE:
        kg = ingot_kg[metal]
        weights[f'tfc:metal/triple_ingot/{metal}'] = round(3 * kg, 6)
        for tool in ['sledgehammer', 'excavator']:
            weights[f'tfc_hammer_time:metal/{tool}_head/{metal}'] = round(6 * kg, 6)
            weights[f'tfc_hammer_time:metal/{tool}/{metal}'] = round(6.5 * kg, 6)

    # Ingots from other mods use the same metal scale, including vanilla iron.
    for metal, kg in ingot_kg.items():
        kg = round(kg, 6)
        tag = f'c:ingots/{metal}'
        tag_weights[tag] = kg
        for item in tag_items(tag):
            weights[item] = kg
        # Ordinary nine-ingot storage blocks keep their crafting mass even
        # when a TFC compatibility melting recipe yields just 100 units.
        storage_tag = f'c:storage_blocks/{metal}'
        tag_weights[storage_tag] = round(9 * kg, 6)
        for item in tag_items(storage_tag):
            if not item.startswith(('tfc:', 'tfc_ie_addon:', 'firmalife:')):
                weights[item] = round(9 * kg, 6)
    for metal in ['iron', 'copper', 'gold']:
        kg = round(ingot_kg[metal], 6)
        for prefix in ['c', 'forge']:
            tag_weights[f'{prefix}:ingots/{metal}'] = kg
        weights[f'minecraft:{metal}_ingot'] = kg
        weights[f'minecraft:{metal}_block'] = round(9 * kg, 6)
        if metal != 'copper':
            weights[f'minecraft:{metal}_nugget'] = round(kg / 9, 6)

    # Ore chunks weigh 1 kg (small pieces 0.25 kg); host-rock blocks 2.4 kg.
    # This overrides low metal-only weights from ore heating recipes.
    for item in list(weights):
        if item.startswith('tfc:ore/'):
            weights[item] = 0.25 if item.startswith('tfc:ore/small_') else 1.0
    # Ultimate Weight's "wildcards" mean any metadata for one exact item ID,
    # not glob patterns. Enumerate actual TFC ore item models instead.
    for item in ore_items:
        weights[item] = (2.4 if '/' in item[len('tfc:ore/'):] else
                         0.25 if item.startswith('tfc:ore/small_') else 1.0)
    weights['tfc:ore/bituminous_coal'] = 0.25
    weights['tfc:ore/lignite'] = 0.2
    for fantasy in ['alexandriite', 'byzantium', 'vitalum', 'mugenium',
                    'antinomia', 'vutironium', 'durallium']:
        for grade in ['normal', 'dense', 'crystalline']:
            weights[f'terra:{grade}_{fantasy}_ore'] = 2.4
    # Ore ingredient tags must agree with exact chunk overrides.
    for tag in list(tag_weights):
        if tag.startswith('tfc:') and ('ore' in tag):
            del tag_weights[tag]

    content = CONFIG.read_text()
    content = re.sub(r'    # BEGIN GENERATED METAL AND ORE WEIGHTS.*?    # END GENERATED METAL AND ORE WEIGHTS\n', '', content, flags=re.S)
    # Preserve hand-maintained sections; replace only the generated blocks.
    content = content.replace('  wildcards:\n  tags:', '  wildcards: {}\n  tags:', 1)
    def block(mapping):
        return (BEGIN + '\n'
                + '    # Metal kg = melting units / 100 * 0.85 * density / 8.96.\n'
                + '    # Alloy densities estimated from TFC recipe volume fractions.\n'
                + ''.join(f'    {key}: {value}\n' for key, value in sorted(mapping.items())) + END + '\n')
    content = content.replace('  exact:\n', '  exact:\n' + block(weights), 1)
    # Remove old metal tag values before installing the generated values.
    for tag in tag_weights:
        content = re.sub(r'^    ' + re.escape(tag) + r': [^\n]+\n', '', content, flags=re.M)
    content = content.replace('  tags:\n', '  tags:\n' + block(tag_weights), 1)
    CONFIG.write_text(content, encoding='utf-8')
    print(f'Generated {len(weights)} exact and {len(tag_weights)} tag weights.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mods', type=Path)
    generate(parser.parse_args().mods)
