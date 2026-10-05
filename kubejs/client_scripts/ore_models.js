// Generate ore models in memory at startup and on resource reload.
// Normal is an internal ID/file prefix only; displayed ore names have no prefix.
ClientEvents.generateAssets('after_mods', event => {
    const ores = [
    {
        "name": "alexandriite",
        "defaultRock": "rhyolite"
    },
    {
        "name": "byzantium",
        "defaultRock": "granite"
    },
    {
        "name": "vitalum",
        "defaultRock": "granite"
    },
    {
        "name": "mugenium",
        "defaultRock": "granite"
    },
    {
        "name": "antinomia",
        "defaultRock": "granite"
    },
    {
        "name": "vutironium",
        "defaultRock": "granite"
    },
    {
        "name": "durallium",
        "defaultRock": "rhyolite"
    }
]
    const rocks = [
    "andesite",
    "basalt",
    "chalk",
    "chert",
    "claystone",
    "conglomerate",
    "dacite",
    "diorite",
    "dolomite",
    "gabbro",
    "gneiss",
    "granite",
    "limestone",
    "marble",
    "phyllite",
    "quartzite",
    "rhyolite",
    "schist",
    "shale",
    "slate",
    "tuff"
]
    const qualities = ['normal', 'dense', 'crystalline']
    ores.forEach(ore => {
        qualities.forEach(quality => {
            const block = `${quality}_${ore.name}_ore`
            const variants = {}
            rocks.forEach(rock => {
                const model = `block/ore/${block}/${rock}`
                event.json(`terra:models/${model}.json`, {
                    parent: 'tfc:block/ore',
                    textures: {
                        all: `tfc:block/rock/raw/${rock}`,
                        overlay: `terra:block/ore/${quality}_${ore.name}`
                    }
                })
                variants[`rock=${rock}`] = { model: `terra:${model}` }
            })
            event.json(`terra:blockstates/${block}.json`, { variants: variants })
            event.json(`terra:models/block/${block}.json`, {
                parent: `terra:block/ore/${block}/${ore.defaultRock}`
            })
            event.json(`terra:models/item/${block}.json`, {
                parent: `terra:block/${block}`
            })
        })
    })
})
