ServerEvents.recipes(event => {
    event.shapeless(
        Item.of('firmalife:food/raw_honey', 8),
        ['firmalife:jar/honey']
    ).id('firmalife:crafting/unjarring_food/raw_honey')})