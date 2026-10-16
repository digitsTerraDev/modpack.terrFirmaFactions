ItemEvents.modifyTooltips(event => {
    event.add('horseman:copper_horn', Text.of('Requires Riding III to bind or call a mount.').gold())
    event.add('minecraft:saddle', Text.of('Requires Riding I to ride a mount; Riding II + Hauling I to hitch animal-drawn carts.').gold())
})
