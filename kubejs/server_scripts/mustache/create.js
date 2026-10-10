// // Train Stuff

// ServerEvents.recipes(event => {

//     // Crafting Table Recipes

//     event.shaped(
//         Item.of('create:wrench'),
//         [
//             'AA',
//             'AB',
//             ' C'
//         ],
//         {
//             A:'tfc:metal/sheet/gold',
//             B:'create:cogwheel',
//             C:'#c:rods'
//         }
//     )
//     .id('create:crafting/kinetics/wrench')

//     event.shaped(
//         Item.of('createvintageneoforged:spring_coiling_machine'),
//         [
//             'A  ',
//             'BCD',
//             'A  '
//         ],
//         {
//             A:'tfc:metal/ingot/wrought_iron',
//             B:'createvintageneoforged:spring_coiling_machine_wheel',
//             C:'create:andesite_casing',
//             D: 'create:shaft'
//         }
//     )
//     .id('createvintageneoforged:craft/spring_coiling_machine')

//     event.shaped(
//         Item.of('createvintageneoforged:spring_coiling_machine_wheel'),
//         [
//             ' A ',
//             'ABA',
//             ' A '
//         ],
//         {
//             A:'create:andesite_alloy',
//             B:'tfc:metal/double_ingot/wrought_iron'
//         }
//     )
//     .id('createvintageneoforged:craft/spring_coiling_machine_wheel')

//     // Sequenced Assembly Recipes

//   event.recipes.create.sequenced_assembly(
//       // Outputs:
//       [
//         CreateItem.of('32x create:track', 32), 
//       ],
//       // Input:
//       '#tfc:lumber', 

//       [
//         // The transitional item set by `transitionalItem('create:incomplete_large_cogwheel')` is the item used during the intermediate stages of the assembly
//         // Like a normal recipe function, it's used as a sequence step in this array. Input and output have the transitional item
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/steel',]),
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/steel',]),
//         event.recipes.create.pressing('create:incomplete_track', 'create:incomplete_track'),
//       ]
//     )
//     .transitionalItem('create:incomplete_track') // Set the transitional item
//     .id('create:sequenced_assembly/track') // Overwrite ID

// event.recipes.create.sequenced_assembly(
//       // Outputs:
//       [
//         CreateItem.of('24x create:track', 24), 
//       ],
//       // Input:
//       '#tfc:lumber', 

//       [
//         // The transitional item set by `transitionalItem('create:incomplete_large_cogwheel')` is the item used during the intermediate stages of the assembly
//         // Like a normal recipe function, it's used as a sequence step in this array. Input and output have the transitional item
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/wrought_iron',]),
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/wrought_iron',]),
//         event.recipes.create.pressing('create:incomplete_track', 'create:incomplete_track'),
//       ]
//     )
//     .transitionalItem('create:incomplete_track') // Set the transitional item

//     event.recipes.create.sequenced_assembly(
//       // Outputs:
//       [
//         CreateItem.of('16x create:track', 16), 
//       ],
//       // Input:
//       '#tfc:lumber', 

//       [
//         // The transitional item set by `transitionalItem('create:incomplete_large_cogwheel')` is the item used during the intermediate stages of the assembly
//         // Like a normal recipe function, it's used as a sequence step in this array. Input and output have the transitional item
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/cast_iron',]),
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/cast_iron',]),
//         event.recipes.create.pressing('create:incomplete_track', 'create:incomplete_track'),
//       ]
//     )
//     .transitionalItem('create:incomplete_track') // Set the transitional item

//     event.recipes.create.sequenced_assembly(
//       // Outputs:
//       [
//         CreateItem.of('16x createbullettrain:copper_bullet_track', 16), 
//       ],
//       // Input:
//       '#tfc:lumber', 

//       [
//         // The transitional item set by `transitionalItem('create:incomplete_large_cogwheel')` is the item used during the intermediate stages of the assembly
//         // Like a normal recipe function, it's used as a sequence step in this array. Input and output have the transitional item
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/copper',]),
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/copper',]),
//         event.recipes.create.pressing('create:incomplete_track', 'create:incomplete_track'),
//       ]
//     )
//     .transitionalItem('create:incomplete_track') // Set the transitional item
//     .id('createbullettrain:copper_bullet_track')

//     event.recipes.create.sequenced_assembly(
//       // Outputs:
//       [
//         CreateItem.of('16x createbullettrain:netherite_bullet_track', 16), 
//       ],
//       // Input:
//       '#tfc:lumber', 

//       [
//         // The transitional item set by `transitionalItem('create:incomplete_large_cogwheel')` is the item used during the intermediate stages of the assembly
//         // Like a normal recipe function, it's used as a sequence step in this array. Input and output have the transitional item
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/black_bronze',]),
//         event.recipes.create.deploying('create:incomplete_track', ['create:incomplete_track', 'tfc:metal/rod/black_bronze',]),
//         event.recipes.create.pressing('create:incomplete_track', 'create:incomplete_track'),
//       ]
//     )
//     .transitionalItem('create:incomplete_track') // Set the transitional item
//     .id('createbullettrain:netherite_bullet_track')

//     // Deploying Recipes

//     event.recipes.create.deploying('createbullettrain:copper_bullet_track', ['create:track', 'tfc:metal/ingot/copper']
//     )
  
//     event.recipes.create.deploying('createbullettrain:brass_bullet_track', ['createbullettrain:copper_bullet_track', 'tfc:metal/ingot/brass']
//     )

//     // Mechanical Crafting Recipes

//     event.recipes.create.mechanical_crafting('createvintageneoforged:helve_hammer', [
//         ' A BB',
//         'ACCCD',
//         'EE  F'
//     ], {
//         A: 'tfc:metal/double_ingot/black_steel',
//         B: 'createvintageneoforged:iron_spring',
//         C: '#minecraft:logs',
//         D: 'create:andesite_casing',
//         E: 'tfc:metal/triple_ingot/black_steel',
//         F: 'create:shaft'
//     })
//     .id('createvintageneoforged:mechanical_crafting/helve_hammer')

//     // Coiling Recipes (Vintage KubeJS not implimented yet)

//     event.recipes.createvintageneoforged
//     .coiling('createvintageneoforged:iron_spring', 'tfc:metal/rod/black_steel')
//     .processingTime(1000)
//     .id('createvintageneoforged:coiling/iron_spring')

//     // event.recipes.createvintageneoforged
//     // .coiling('2x tfc:metal/rod/copper', 'tfc:metal/ingot/copper')
//     // .processingTime(1000)
//     // .id('createvintageneoforged:coiling/copper_rod')
// })

// ServerEvents.recipes(event => {
  
// })