const AreaClientPlayer = Java.loadClass('net.minecraft.client.player.LocalPlayer')
const AreaClientTags = Java.loadClass('net.minecraft.tags.BlockTags')
const AreaClientTagKey = Java.loadClass('net.minecraft.tags.TagKey')
const AreaClientRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const AreaClientId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const AreaClientHammers = AreaClientTagKey.create(AreaClientRegistries.ITEM, AreaClientId.parse('tfc_hammer_time:sledgehammers'))
const AreaClientExcavators = AreaClientTagKey.create(AreaClientRegistries.ITEM, AreaClientId.parse('tfc_hammer_time:excavators'))
let areaClientHammering = 0
let areaClientExcavating = 0
const DiggingClientShovels = AreaClientTagKey.create(AreaClientRegistries.ITEM, AreaClientId.parse('minecraft:shovels'))
const DiggingClientPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const DiggingClientRanks = Java.loadClass('com.terraskills.powers.client.ClientSkillRanks')

const MiningClientPickaxes = AreaClientTagKey.create(AreaClientRegistries.ITEM, AreaClientId.parse('minecraft:pickaxes'))
const MiningClientStoneTags = Java.loadClass('net.dries007.tfc.common.TFCTags$Blocks')
NativeEvents.onEvent(DiggingClientPriority.LOWEST, 'net.neoforged.neoforge.event.entity.player.PlayerEvent$BreakSpeed', event => {
    const player = event.getEntity()
    if (!(player instanceof AreaClientPlayer)) return
    const tool = player.getMainHandItem()
    const pickaxe = tool['is(net.minecraft.tags.TagKey)'](MiningClientPickaxes)
    const shovel = tool['is(net.minecraft.tags.TagKey)'](DiggingClientShovels)
    if (!pickaxe && !shovel) return
    let nativeBonus = 1 + (DiggingClientRanks.brutishActive() ? 0.5 * DiggingClientRanks.brutishMining() : 0)
    let extraBonus = 0
    if (pickaxe) {
        const mining = DiggingClientRanks.mining()
        nativeBonus += 0.05 * mining
        extraBonus += 0.01 * mining
        if (player.y < 0) nativeBonus += 0.05 * DiggingClientRanks.deepMining()
        if (event.getState()['is(net.minecraft.tags.TagKey)'](MiningClientStoneTags.STONES_RAW)) nativeBonus += 0.04 * DiggingClientRanks.stoneMining()
    }
    if (shovel && event.getState()['is(net.minecraft.tags.TagKey)'](AreaClientTags.MINEABLE_WITH_SHOVEL)) {
        const digging = DiggingClientRanks.excavating()
        nativeBonus += 0.03 * digging
        extraBonus += 0.03 * digging
    }
    if (extraBonus > 0) event.setNewSpeed(event.getNewSpeed() * (nativeBonus + extraBonus) / nativeBonus)
})

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
    if (tool['is(net.minecraft.tags.TagKey)'](AreaClientHammers)) {
        if (areaClientHammering === 0) event.setNewSpeed(0)
        else if (event.getState()['is(net.minecraft.tags.TagKey)'](AreaClientTags.MINEABLE_WITH_PICKAXE)) event.setNewSpeed(event.getNewSpeed() * (1 + 0.07 * areaClientHammering))
    } else if (tool['is(net.minecraft.tags.TagKey)'](AreaClientExcavators)) {
        if (areaClientExcavating === 0) event.setNewSpeed(0)
        else if (event.getState()['is(net.minecraft.tags.TagKey)'](AreaClientTags.MINEABLE_WITH_SHOVEL)) event.setNewSpeed(event.getNewSpeed() * (1 + 0.07 * areaClientExcavating))
    }
})
ItemEvents.modifyTooltips(event => {
    event.add('#tfc_hammer_time:sledgehammers', Text.of('Requires Hammering I to use.').gold())
    event.add('#tfc_hammer_time:excavators', Text.of('Requires Excavating I to use.').gold())
})
