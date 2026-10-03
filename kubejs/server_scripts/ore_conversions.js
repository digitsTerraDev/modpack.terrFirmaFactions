ServerEvents.recipes(event => {
    event.shapeless('tfc:ore/small_native_copper', ['terra:alexandriite_ore'])
        .id('terra:ore_conversion/alexandriite')

    event.shapeless('tfc:ore/small_cassiterite', ['terra:byzantium_ore'])
        .id('terra:ore_conversion/byzantium')

    event.shapeless('tfc:ore/small_sphalerite', ['terra:vitalum_ore'])
        .id('terra:ore_conversion/vitalum')

    event.shapeless('tfc:ore/small_bismuthinite', ['terra:mugenium_ore'])
        .id('terra:ore_conversion/mugenium')

    event.shapeless('tfc:ore/small_native_silver', ['terra:antinomia_ore'])
        .id('terra:ore_conversion/antinomia')

    event.shapeless('tfc:ore/small_native_gold', ['terra:vutironium_ore'])
        .id('terra:ore_conversion/vutironium')

    event.shapeless('tfc:ore/small_hematite', ['terra:durallium_ore'])
        .id('terra:ore_conversion/durallium')
})