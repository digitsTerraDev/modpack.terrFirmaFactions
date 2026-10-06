const RefineryDefinitions = Java.loadClass(
    'com.digitscodecompendium.terraindustry.refinery.RefineryDefinitions'
)

const fantasyOres = [
    {
        source: 'terra:alexandriite_ore',
        ore: 'native_copper',
        crystal: 'terra:alexandriite_crystal'
    },
    {
        source: 'terra:byzantium_ore',
        ore: 'cassiterite',
        crystal: 'terra:byzantium_crystal'
    },
    {
        source: 'terra:vitalum_ore',
        ore: 'sphalerite',
        crystal: 'terra:vitalum_crystal'
    },
    {
        source: 'terra:mugenium_ore',
        ore: 'bismuthinite',
        crystal: 'terra:mugenium_crystal'
    },
    {
        source: 'terra:antinomia_ore',
        ore: 'native_silver',
        crystal: 'terra:antinomia_crystal'
    },
    {
        source: 'terra:vutironium_ore',
        ore: 'native_gold',
        crystal: 'terra:vutironium_crystal'
    },
    {
        source: 'terra:durallium_ore',
        ore: 'hematite',
        crystal: 'terra:durallium_crystal'
    }
]

fantasyOres.forEach(fantasyOre => {
    const refineryId = fantasyOre.source.replace('_ore', '_refinery')
    const refinery = RefineryDefinitions.refinery(refineryId)
        .cycleTicks(120)
        .fuelItem('minecraft:coal', 1, 120)

    const fantasyName = fantasyOre.source.substring('terra:'.length)
    // Mined ore loses its host-rock state and is placed as tuff.
    const poorOre = `tfc:ore/poor_${fantasyOre.ore}/tuff`
    const normalOre = `tfc:ore/normal_${fantasyOre.ore}/tuff`
    const richOre = `tfc:ore/rich_${fantasyOre.ore}/tuff`
    refinery.transform(`terra:normal_${fantasyName}[rock=tuff]`, normalOre, 1.0)
    refinery.transform(`terra:dense_${fantasyName}[rock=tuff]`, richOre, 1.0)
    refinery.transform(`terra:crystalline_${fantasyName}[rock=tuff]`, poorOre, 1.0)
    refinery.crystallize(poorOre, fantasyOre.crystal, 0.1)
    refinery.register()
})
