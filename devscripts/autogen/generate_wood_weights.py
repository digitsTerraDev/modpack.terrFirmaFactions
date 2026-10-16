"""Species-based Ultimate Weight rules. Run with the instance's mods directory.

Typical seasoned wood (~12% moisture); no dynamic green/dry moisture simulation.
Oak logs retain the pack's 2.4 kg anchor, oak planks retain 0.45 kg.
Lumber is 1/4 of a plank, slabs 1/2 and stairs 3/4 (gameplay size assumptions).
"""
import argparse
import re
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'config/wfweight/weight_config_modern.yaml'
BEGIN = '    # BEGIN GENERATED WOOD WEIGHTS'
END = '    # END GENERATED WOOD WEIGHTS'
# kg/m3, representative species (not universal values for entire genera).
# Wood Database: https://www.wood-database.com/<slug>/, average dried weight.
# Kapok: PROTA Ceiba pentandra, midpoint of 240-380 kg/m3 at 12% moisture:
# https://plantuse.plantnet.org/en/Ceiba_pentandra_%28PROTA%29
# Mangrove: approximate air-dry value based on the University of Brasilia
# Rhizophora mangle study (911.83 kg/m3 at 15.34% moisture):
# https://www.rcaap.pt/detail.jsp?id=oai%3Abdm.unb.br%3A10483%2F21908
WOODS = {
    'acacia': (1185, 'camelthorn'),
    'ash': (675, 'white-ash'),
    'aspen': (415, 'quaking-aspen'),
    'birch': (690, 'yellow-birch'),
    'blackwood': (1270, 'african-blackwood'),
    'chestnut': (590, 'sweet-chestnut'),
    'douglas_fir': (510, 'douglas-fir'),
    'hickory': (800, 'shagbark-hickory'),
    'kapok': (310, 'Ceiba pentandra, PROTA midpoint'),
    'mangrove': (900, 'Rhizophora mangle, air-dry approximation'),
    'maple': (705, 'hard-maple'),
    'oak': (755, 'white-oak'),
    'palm': (820, 'red-palm'),
    'pine': (400, 'eastern-white-pine'),
    'rosewood': (855, 'east-indian-rosewood'),
    'sequoia': (415, 'coast-redwood'),
    'spruce': (405, 'norway-spruce'),
    'sycamore': (545, 'sycamore'),
    'white_cedar': (350, 'northern-white-cedar'),
    'willow': (415, 'black-willow'),
}


def generate(mods):
    # Enumerate existing models so no invented item IDs are emitted.
    items = set()
    for jar in sorted(mods.glob('*.jar')):
        with ZipFile(jar) as archive:
            for name in archive.namelist():
                match = re.fullmatch(r'assets/([^/]+)/models/item/(.+)\.json', name)
                if match:
                    items.add(f'{match[1]}:{match[2]}')
    if 'tfc:wood/log/oak' not in items:
        raise ValueError('Expected TFC item models in the supplied mods directory')
    weights = {}
    for wood, (density, source) in WOODS.items():
        ratio = density / WOODS['oak'][0]
        for form, oak_kg in {
                'log': 2.4, 'stripped_log': 2.4, 'wood': 2.4,
                'stripped_wood': 2.4, 'planks': 0.45, 'lumber': 0.1125}.items():
            item = f'tfc:wood/{form}/{wood}'
            if item in items:
                weights[item] = round(oak_kg * ratio, 6)
        for suffix, factor in [('slab', 0.5), ('stairs', 0.75)]:
            item = f'tfc:wood/planks/{wood}_{suffix}'
            if item in items:
                weights[item] = round(0.45 * factor * ratio, 6)

    # Vanilla woods use the same representative species as TFC.
    # Jungle -> kapok, dark oak -> oak. Nether stems and magical woods have
    # no real density analogue and continue to use the existing tag fallback.
    vanilla_species = dict(WOODS, cherry=(560, 'black-cherry'))
    for vanilla, wood in {
            'oak': 'oak', 'dark_oak': 'oak', 'spruce': 'spruce',
            'birch': 'birch', 'acacia': 'acacia', 'jungle': 'kapok',
            'mangrove': 'mangrove', 'cherry': 'cherry'}.items():
        ratio = vanilla_species[wood][0] / WOODS['oak'][0]
        for name, oak_kg in {
                f'{vanilla}_log': 2.4, f'{vanilla}_wood': 2.4,
                f'stripped_{vanilla}_log': 2.4,
                f'stripped_{vanilla}_wood': 2.4,
                f'{vanilla}_planks': 0.45, f'{vanilla}_slab': 0.225,
                f'{vanilla}_stairs': 0.3375}.items():
            weights[f'minecraft:{name}'] = round(oak_kg * ratio, 6)

    content = CONFIG.read_text()
    content = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END) + r'\n',
                     '', content, flags=re.S)
    block = BEGIN + '\n'
    block += '    # Typical dry species densities; oak log 2.4 kg, oak plank 0.45 kg.\n'
    block += '    # Broad species names use representative real woods; see generator.\n'
    for wood, (density, source) in sorted(WOODS.items()):
        block += f'    # {wood}: {density} kg/m3 ({source})\n'
    block += ''.join(f'    {item}: {kg}\n' for item, kg in sorted(weights.items()))
    block += END + '\n'
    content = content.replace('  exact:\n', '  exact:\n' + block, 1)
    CONFIG.write_text(content, encoding='utf-8')
    print(f'Generated {len(weights)} wood weights across {len(WOODS)} TFC species.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mods', type=Path)
    generate(parser.parse_args().mods)
