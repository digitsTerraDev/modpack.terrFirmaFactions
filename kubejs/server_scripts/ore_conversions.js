ServerEvents.recipes(event => {
    // Only regular/normal fantasy ores can be crafted directly into small ore pieces.
    event.shapeless('tfc:ore/small_native_copper', ['terra:normal_alexandriite_ore'])
        .id('terra:ore_conversion/normal_alexandriite')

    event.shapeless('tfc:ore/small_cassiterite', ['terra:normal_byzantium_ore'])
        .id('terra:ore_conversion/normal_byzantium')

    event.shapeless('tfc:ore/small_sphalerite', ['terra:normal_vitalum_ore'])
        .id('terra:ore_conversion/normal_vitalum')

    event.shapeless('tfc:ore/small_bismuthinite', ['terra:normal_mugenium_ore'])
        .id('terra:ore_conversion/normal_mugenium')

    event.shapeless('tfc:ore/small_native_silver', ['terra:normal_antinomia_ore'])
        .id('terra:ore_conversion/normal_antinomia')

    event.shapeless('tfc:ore/small_native_gold', ['terra:normal_vutironium_ore'])
        .id('terra:ore_conversion/normal_vutironium')

    event.shapeless('tfc:ore/small_hematite', ['terra:normal_durallium_ore'])
        .id('terra:ore_conversion/normal_durallium')

})
