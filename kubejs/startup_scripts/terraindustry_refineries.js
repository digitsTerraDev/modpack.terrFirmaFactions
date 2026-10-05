const RefineryDefinitions = Java.loadClass(
    'com.digitscodecompendium.terraindustry.refinery.RefineryDefinitions'
)

const fantasyOres = [
    {
        source: 'terra:alexandriite_ore',
        ore: 'native_copper',
        hostRock: 'rhyolite',
        crystal: 'terra:alexandriite_crystal'
    },
    {
        source: 'terra:byzantium_ore',
        ore: 'cassiterite',
        hostRock: 'granite',
        crystal: 'terra:byzantium_crystal'
    },
    {
        source: 'terra:vitalum_ore',
        ore: 'sphalerite',
        hostRock: 'granite',
        crystal: 'terra:vitalum_crystal'
    },
    {
        source: 'terra:mugenium_ore',
        ore: 'bismuthinite',
        hostRock: 'granite',
        crystal: 'terra:mugenium_crystal'
    },
    {
        source: 'terra:antinomia_ore',
        ore: 'native_silver',
        hostRock: 'granite',
        crystal: 'terra:antinomia_crystal'
    },
    {
        source: 'terra:vutironium_ore',
        ore: 'native_gold',
        hostRock: 'granite',
        crystal: 'terra:vutironium_crystal'
    },
    {
        source: 'terra:durallium_ore',
        ore: 'hematite',
        hostRock: 'rhyolite',
        crystal: 'terra:durallium_crystal'
    }
]

fantasyOres.forEach(fantasyOre => {
    const refineryId = fantasyOre.source.replace('_ore', '_refinery')
    const refinery = RefineryDefinitions.refinery(refineryId)
        .cycleTicks(120)
        .fuelItem('minecraft:coal', 1, 120)

    const poorOre = `tfc:ore/poor_${fantasyOre.ore}/${fantasyOre.hostRock}`
    const normalOre = `tfc:ore/normal_${fantasyOre.ore}/${fantasyOre.hostRock}`
    const richOre = `tfc:ore/rich_${fantasyOre.ore}/${fantasyOre.hostRock}`

    refinery.transform(fantasyOre.source, poorOre, 1.0)
    refinery.transform(poorOre, normalOre, 1.0)
    refinery.transform(normalOre, richOre, 1.0)
    refinery.crystallize(richOre, fantasyOre.crystal, 1.0)
    refinery.register()
})
