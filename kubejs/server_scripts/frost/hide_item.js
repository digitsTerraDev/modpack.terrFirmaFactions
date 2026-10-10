ServerEvents.recipes(event => {
	event.remove({ mod: 'survivorsdelight' })
	event.remove({ mod: 'farmersdelight' })
})
const keep = []

RecipeViewerEvents.removeEntries('item', event => {
    Ingredient.of('@survivorsdelight').itemIds.forEach(id => {
        if (!keep.includes(id)) {
            event.remove(id)
        }
    })
	Ingredient.of('@farmersdelight').itemIds.forEach(id => {
        if (!keep.includes(id)) {
            event.remove(id)
        }
    })
})
