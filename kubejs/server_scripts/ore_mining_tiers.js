// TFC copper harvests stone-tier blocks; bronze harvests iron-tier blocks.
ServerEvents.tags('block', event => {
    const rocks = ["andesite", "basalt", "chalk", "chert", "claystone", "conglomerate", "dacite", "diorite", "dolomite", "gabbro", "gneiss", "granite", "limestone", "marble", "phyllite", "quartzite", "rhyolite", "schist", "shale", "slate", "tuff"]
    const copperOres = ['native_copper', 'malachite', 'tetrahedrite', 'cassiterite', 'bismuthinite', 'sphalerite', 'native_gold', 'native_silver']
    const bronzeOres = ['hematite', 'magnetite', 'limonite', 'garnierite']
    ;['poor', 'normal', 'rich'].forEach(grade => {
        rocks.forEach(rock => {
            copperOres.forEach(ore => event.add('minecraft:needs_stone_tool', `tfc:ore/${grade}_${ore}/${rock}`))
            bronzeOres.forEach(ore => event.add('minecraft:needs_iron_tool', `tfc:ore/${grade}_${ore}/${rock}`))
        })
    })
})
