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
    if (held.is(AreaHammerTag)) return { rank: areaToolRank(player, 'hammering'), title: 'Hammering', bonus: 0.05, blockTag: AreaTags.MINEABLE_WITH_PICKAXE }
    if (held.is(AreaExcavatorTag)) return { rank: areaToolRank(player, 'area_excavating'), title: 'Excavating', bonus: 0.03, blockTag: AreaTags.MINEABLE_WITH_SHOVEL }
    return null
}

function areaToolDeny(event, player, info) {
    event.setCanceled(true)
    // Throttle the message while a player holds down attack.
    const data = player.getPersistentData()
    const now = player.level.getGameTime()
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
    else if (event.getState().is(info.blockTag)) event.setNewSpeed(event.getNewSpeed() * (1 + info.bonus * info.rank))
})

// Mirror ranks for client prediction; the server always reads live ranks above.
NativeEvents.onEvent('net.neoforged.neoforge.event.tick.PlayerTickEvent$Post', event => {
    const player = event.getEntity()
    if (!(player instanceof AreaPlayer) || player.tickCount % 10 !== 0) return
    player.sendData('terra_area_tools', { hammering: areaToolRank(player, 'hammering'), excavating: areaToolRank(player, 'area_excavating') })
})
