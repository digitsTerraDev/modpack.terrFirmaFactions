// Existing hook IDs are retained: mount_speed = Riding, riding_pull_percent = Hauling.
const MountGateSkills = Java.loadClass('net.puffish.skillsmod.api.SkillsAPI')
const MountGateId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const MountGatePlayer = Java.loadClass('net.minecraft.server.level.ServerPlayer')
const MountGateServerLevel = Java.loadClass('net.minecraft.server.level.ServerLevel')
const MountGateHorse = Java.loadClass('net.minecraft.world.entity.animal.horse.AbstractHorse')
const MountGateCart = Java.loadClass('com.jusipat.astikorcartsredux.entity.AbstractDrawnEntity')
const MountGateRegistry = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const MountGateMessage = Java.loadClass('net.minecraft.network.chat.Component')
const MountGateCategory = MountGateId.fromNamespaceAndPath('terraskills', 'mounts')
const MountFootingHooksCategory = MountGateId.fromNamespaceAndPath('terraskills', 'mount_hooks')

// Footing is one researched skill. v0.0.8 reads jump and step ranks separately,
// so mirror its jump rank into an internal category that remains locked in the UI.
// Read current state each tick so research, refunds and resets stay synchronized.
NativeEvents.onEvent('net.neoforged.neoforge.event.tick.PlayerTickEvent$Pre', event => {
    const player = event.getEntity()
    if (!(player instanceof MountGatePlayer)) return
    const mounts = MountGateSkills.getCategory(MountGateCategory)
    const hooks = MountGateSkills.getCategory(MountFootingHooksCategory)
    if (!mounts.isPresent() || !hooks.isPresent()) return
    let footingRank = 0
    for (let rank = 5; rank >= 1; rank--) {
        const skill = mounts.get().getSkill('pack_animal_step_limit_' + rank)
        if (skill.isPresent() && String(skill.get().getState(player)) === 'UNLOCKED') {
            footingRank = rank
            break
        }
    }
    for (let rank = 1; rank <= 5; rank++) {
        const hook = hooks.get().getSkill('pack_animal_jump_limit_' + rank)
        if (!hook.isPresent()) continue
        const unlocked = String(hook.get().getState(player)) === 'UNLOCKED'
        if (rank <= footingRank && !unlocked) hook.get().unlock(player)
        else if (rank > footingRank && unlocked) hook.get().lock(player)
    }
})

function mountGateHasLevel(player, prefix, required) {
    const category = MountGateSkills.getCategory(MountGateCategory)
    if (!category.isPresent()) return false
    for (let level = 5; level >= required; level--) {
        const skill = category.get().getSkill(prefix + '_' + level)
        if (skill.isPresent() && skill.get().getState(player).name() === 'UNLOCKED') return true
    }
    return false
}

function mountGateNotify(player, message) {
    player.displayClientMessage(MountGateMessage.literal(message), true)
}

NativeEvents.onEvent('net.neoforged.neoforge.event.entity.EntityMountEvent', event => {
    const player = event.getEntityMounting()
    if (!event.isMounting() || !(player instanceof MountGatePlayer)) return
    if (!(event.getEntityBeingMounted() instanceof MountGateHorse)) return
    if (!mountGateHasLevel(player, 'mount_speed', 1)) {
        event.setCanceled(true)
        mountGateNotify(player, 'Riding I is required to ride mounts.')
    }
})

// Astikor's action-key packet has no cancellable attachment event. Reject an
// unqualified rider's hitch on the cart's next tick, before its pulling logic.
// Player-pulled hand carts and parked, unattended animal hitches are unaffected.
NativeEvents.onEvent('net.neoforged.neoforge.event.tick.EntityTickEvent$Pre', event => {
    const cart = event.getEntity()
    // KubeJS exposes Entity.level as a property, shadowing the Java level() method.
    if (!(cart instanceof MountGateCart) || !(cart.level instanceof MountGateServerLevel)) return
    const horse = cart.getPulling()
    if (!(horse instanceof MountGateHorse)) return
    const rider = horse.getControllingPassenger()
    if (!(rider instanceof MountGatePlayer)) return
    if (!mountGateHasLevel(rider, 'mount_speed', 2) || !mountGateHasLevel(rider, 'riding_pull_percent', 1)) {
        cart.setPulling(null)
        mountGateNotify(rider, 'Riding II and Hauling I are required to hitch and drive animal-drawn carts.')
    }
})

function mountGateCopperHorn(event) {
    const player = event.getEntity()
    if (!(player instanceof MountGatePlayer)) return
    const item = MountGateRegistry.ITEM.getKey(event.getItemStack().getItem()).toString()
    if (item !== 'horseman:copper_horn') return
    if (!mountGateHasLevel(player, 'mount_speed', 3)) {
        event.setCanceled(true)
        mountGateNotify(player, 'Riding III is required to bind and call mounts with a copper horn.')
    }
}

// Cover calling in either hand and binding directly to a mount.
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$RightClickItem', mountGateCopperHorn)
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$EntityInteract', mountGateCopperHorn)
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$EntityInteractSpecific', mountGateCopperHorn)
