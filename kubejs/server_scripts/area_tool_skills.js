// Digging retains legacy excavating_* IDs; area_excavating_* is the new 3x3 skill.
const AreaSkills = Java.loadClass('net.puffish.skillsmod.api.SkillsAPI')
const AreaId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const AreaPlayer = Java.loadClass('net.minecraft.server.level.ServerPlayer')
const AreaTags = Java.loadClass('net.minecraft.tags.BlockTags')
const AreaItemTags = Java.loadClass('net.minecraft.tags.TagKey')
const AreaRegistries = Java.loadClass('net.minecraft.core.registries.Registries')
const AreaMessage = Java.loadClass('net.minecraft.network.chat.Component')
const AreaCategory = AreaId.fromNamespaceAndPath('terraskills', 'miner')
const AreaHammerTag = AreaItemTags.create(AreaRegistries.ITEM, AreaId.parse('tfc_hammer_time:sledgehammers'))
const AreaExcavatorTag = AreaItemTags.create(AreaRegistries.ITEM, AreaId.parse('tfc_hammer_time:excavators'))
const DiggingShovelTag = AreaItemTags.create(AreaRegistries.ITEM, AreaId.parse('minecraft:shovels'))
const DiggingEventPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const DiggingBrutish = Java.loadClass('com.terraskills.powers.mining.BrutishMining')

// Powers 0.0.9 supplies 5% Mining and 3% Digging. Adjust only those
// contributions, retaining additive deep/stone/Brutish bonuses and other mods.
const MiningPickaxeTag = AreaItemTags.create(AreaRegistries.ITEM, AreaId.parse('minecraft:pickaxes'))
const MiningStoneTags = Java.loadClass('net.dries007.tfc.common.TFCTags$Blocks')
NativeEvents.onEvent(DiggingEventPriority.LOWEST, 'net.neoforged.neoforge.event.entity.player.PlayerEvent$BreakSpeed', event => {
    const player = event.getEntity()
    if (!(player instanceof AreaPlayer)) return
    const tool = player.getMainHandItem()
    const pickaxe = tool['is(net.minecraft.tags.TagKey)'](MiningPickaxeTag)
    const shovel = tool['is(net.minecraft.tags.TagKey)'](DiggingShovelTag)
    if (!pickaxe && !shovel) return
    let nativeBonus = 1 + 0.5 * DiggingBrutish.activeRank(player)
    let extraBonus = 0
    if (pickaxe) {
        const mining = areaToolRank(player, 'miner')
        nativeBonus += 0.05 * mining
        extraBonus += 0.01 * mining
        if (player.y < 0) nativeBonus += 0.05 * areaToolRank(player, 'deep_mining')
        if (event.getState()['is(net.minecraft.tags.TagKey)'](MiningStoneTags.STONES_RAW)) nativeBonus += 0.04 * areaToolRank(player, 'stone_mining')
    }
    if (shovel && event.getState()['is(net.minecraft.tags.TagKey)'](AreaTags.MINEABLE_WITH_SHOVEL)) {
        const digging = areaToolRank(player, 'excavating')
        nativeBonus += 0.03 * digging
        extraBonus += 0.03 * digging
    }
    if (extraBonus > 0) event.setNewSpeed(event.getNewSpeed() * (nativeBonus + extraBonus) / nativeBonus)
})

function areaToolRank(player, prefix) {
    const category = AreaSkills.getCategory(AreaCategory)
    if (!category.isPresent()) return 0
    for (let rank = 5; rank >= 1; rank--) {
        const skill = category.get().getSkill(prefix + '_' + rank)
        if (skill.isPresent() && String(skill.get().getState(player)) === 'UNLOCKED') return rank
    }
    return 0
}

function areaToolInfo(player) {
    const held = player.getMainHandItem()
    if (held['is(net.minecraft.tags.TagKey)'](AreaHammerTag)) return { rank: areaToolRank(player, 'hammering'), title: 'Hammering', bonus: 0.07, blockTag: AreaTags.MINEABLE_WITH_PICKAXE }
    if (held['is(net.minecraft.tags.TagKey)'](AreaExcavatorTag)) return { rank: areaToolRank(player, 'area_excavating'), title: 'Excavating', bonus: 0.07, blockTag: AreaTags.MINEABLE_WITH_SHOVEL }
    return null
}

function areaToolDeny(event, player, info) {
    event.setCanceled(true)
    // Throttle the message while a player holds down attack.
    const data = player.getPersistentData()
    const now = player.tickCount
    if (!data.contains('terra_area_tool_message') || now - data.getLong('terra_area_tool_message') >= 20 || now < data.getLong('terra_area_tool_message')) {
        data.putLong('terra_area_tool_message', now)
        player.displayClientMessage(AreaMessage.literal(info.title + ' I is required to use this tool.'), true)
    }
}

// Reject interaction before Hammer Time can start its area-mining operation.
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$LeftClickBlock', event => {
    const player = event.getEntity()
    if (!(player instanceof AreaPlayer)) return
    const info = areaToolInfo(player)
    if (info !== null && info.rank === 0) areaToolDeny(event, player, info)
})

// Also reject direct/secondary block-break paths and tools swapped mid-action.
NativeEvents.onEvent('net.neoforged.neoforge.event.level.BlockEvent$BreakEvent', event => {
    const player = event.getPlayer()
    if (!(player instanceof AreaPlayer)) return
    const info = areaToolInfo(player)
    if (info !== null && info.rank === 0) areaToolDeny(event, player, info)
})

NativeEvents.onEvent('net.neoforged.neoforge.event.entity.player.PlayerEvent$BreakSpeed', event => {
    const player = event.getEntity()
    if (!(player instanceof AreaPlayer)) return
    const info = areaToolInfo(player)
    if (info === null) return
    if (info.rank === 0) event.setNewSpeed(0)
    else if (event.getState()['is(net.minecraft.tags.TagKey)'](info.blockTag)) event.setNewSpeed(event.getNewSpeed() * (1 + info.bonus * info.rank))
})

// Mirror ranks for client prediction; the server always reads live ranks above.
NativeEvents.onEvent('net.neoforged.neoforge.event.tick.PlayerTickEvent$Post', event => {
    const player = event.getEntity()
    if (!(player instanceof AreaPlayer) || player.tickCount % 10 !== 0) return
    player.sendData('terra_area_tools', { hammering: areaToolRank(player, 'hammering'), excavating: areaToolRank(player, 'area_excavating') })
})
