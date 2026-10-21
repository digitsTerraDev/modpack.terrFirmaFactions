const AreaClientPlayer = Java.loadClass('net.minecraft.client.player.LocalPlayer')
const AreaClientTags = Java.loadClass('net.minecraft.tags.BlockTags')
const AreaClientTagKey = Java.loadClass('net.minecraft.tags.TagKey')
const AreaClientRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const AreaClientId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const AreaClientHammers = AreaClientTagKey.create(AreaClientRegistries.ITEM, AreaClientId.parse('tfc_hammer_time:sledgehammers'))
const AreaClientExcavators = AreaClientTagKey.create(AreaClientRegistries.ITEM, AreaClientId.parse('tfc_hammer_time:excavators'))
let areaClientHammering = 0
let areaClientExcavating = 0

NetworkEvents.dataReceived('terra_area_tools', event => {
    areaClientHammering = Math.max(0, Math.min(5, event.getData().getInt('hammering')))
    areaClientExcavating = Math.max(0, Math.min(5, event.getData().getInt('excavating')))
})
ClientEvents.tick(event => {
    if (Client.player === null) {
        areaClientHammering = 0
        areaClientExcavating = 0
    }
})
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.player.PlayerEvent$BreakSpeed', event => {
    const player = event.getEntity()
    if (!(player instanceof AreaClientPlayer)) return
    const tool = player.getMainHandItem()
    if (tool.is(AreaClientHammers)) {
        if (areaClientHammering === 0) event.setNewSpeed(0)
        else if (event.getState().is(AreaClientTags.MINEABLE_WITH_PICKAXE)) event.setNewSpeed(event.getNewSpeed() * (1 + 0.05 * areaClientHammering))
    } else if (tool.is(AreaClientExcavators)) {
        if (areaClientExcavating === 0) event.setNewSpeed(0)
        else if (event.getState().is(AreaClientTags.MINEABLE_WITH_SHOVEL)) event.setNewSpeed(event.getNewSpeed() * (1 + 0.03 * areaClientExcavating))
    }
})
ItemEvents.modifyTooltips(event => {
    event.add('#tfc_hammer_time:sledgehammers', Text.of('Requires Hammering I to use.').gold())
    event.add('#tfc_hammer_time:excavators', Text.of('Requires Excavating I to use.').gold())
})
