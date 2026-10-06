// Bronze and wrought iron share a vanilla harvest tag. Add a nickel-only
// denial rule to copper/bronze pickaxes without changing their tiers or stats.
const NickelToolComponent = Java.loadClass('net.minecraft.core.component.DataComponents')
const NickelTool = Java.loadClass('net.minecraft.world.item.component.Tool')
const NickelToolRule = Java.loadClass('net.minecraft.world.item.component.Tool$Rule')
const NickelBlockTags = Java.loadClass('net.minecraft.tags.BlockTags')
const NickelList = Java.loadClass('java.util.ArrayList')

ItemEvents.modification(event => {
    const nickelTag = NickelBlockTags.create('terra:needs_wrought_iron_tool')
    ;['copper', 'bronze', 'bismuth_bronze', 'black_bronze'].forEach(metal => {
        event.modify(`tfc:metal/pickaxe/${metal}`, item => {
            const original = item.get(NickelToolComponent.TOOL)
            const rules = new NickelList()
            rules.add(NickelToolRule.deniesDrops(nickelTag))
            rules.addAll(original.rules())
            item.setTool(new NickelTool(rules, original.defaultMiningSpeed(), original.damagePerBlock()))
        })
    })
})
