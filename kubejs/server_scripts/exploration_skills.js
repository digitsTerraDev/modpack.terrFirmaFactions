// Temporary pack implementation. Native powers must replace these handlers,
// rather than applying a second bonus. Only the highest unlocked rank is used.
const ExploreSkills = Java.loadClass('net.puffish.skillsmod.api.SkillsAPI')
const ExploreId = Java.loadClass('net.minecraft.resources.ResourceLocation')
const ExplorePlayer = Java.loadClass('net.minecraft.server.level.ServerPlayer')
const ExploreAttributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
const ExploreModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
const ExploreOperation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
const ExploreNeoForge = Java.loadClass('net.neoforged.neoforge.common.NeoForgeMod')
const ExploreFluids = Java.loadClass('net.minecraft.tags.FluidTags')
const ExploreRegistry = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const ExploreCategory = ExploreId.fromNamespaceAndPath('terraskills', 'exploration')
const ExploreSwimId = ExploreId.fromNamespaceAndPath('terraskills', 'exploration_swimming')
const ExploreDiveId = ExploreId.fromNamespaceAndPath('terraskills', 'exploration_diving')
const ExploreWadeId = ExploreId.fromNamespaceAndPath('terraskills', 'exploration_wading')

function explorationRank(player, skill) {
    const category = ExploreSkills.getCategory(ExploreCategory)
    if (!category.isPresent()) return 0
    for (let rank = 5; rank >= 1; rank--) {
        const entry = category.get().getSkill(skill + '_' + rank)
        if (entry.isPresent() && String(entry.get().getState(player)) === 'UNLOCKED') return rank
    }
    return 0
}

function explorationModifier(player, attribute, id, amount, operation) {
    const instance = player.getAttribute(attribute)
    if (instance === null) return
    const existing = instance.getModifier(id)
    if (existing !== null && existing.amount() === amount) return
    if (existing !== null) instance.removeModifier(id)
    if (amount > 0) instance.addTransientModifier(new ExploreModifier(id, amount, operation))
}

NativeEvents.onEvent('net.neoforged.neoforge.event.tick.PlayerTickEvent$Post', event => {
    const player = event.getEntity()
    if (!(player instanceof ExplorePlayer)) return
    const inWaterOnFoot = player.isInWater() && !player.isPassenger()
    const wading = inWaterOnFoot && !player.isSwimming() && !player.isEyeInFluid(ExploreFluids.WATER)
    explorationModifier(player, ExploreNeoForge.SWIM_SPEED,
        ExploreSwimId, inWaterOnFoot ? 0.07 * explorationRank(player, 'swimming') : 0,
        ExploreOperation.ADD_MULTIPLIED_BASE)
    explorationModifier(player, ExploreAttributes.OXYGEN_BONUS,
        ExploreDiveId, 0.2 * explorationRank(player, 'diving'), ExploreOperation.ADD_VALUE)
    explorationModifier(player, ExploreAttributes.WATER_MOVEMENT_EFFICIENCY,
        ExploreWadeId, wading ? 0.1 * explorationRank(player, 'wading') : 0, ExploreOperation.ADD_VALUE)
})

NativeEvents.onEvent('net.neoforged.neoforge.event.level.BlockDropsEvent', event => {
    if (event.isCanceled()) return
    const player = event.getBreaker()
    if (!(player instanceof ExplorePlayer) || player.isCreative() || player.isSpectator()) return
    // TFC's survival-obtainable crop items plant cultivated crops, not these
    // wild-crop blocks. Do not extend to placeable bushes without provenance.
    const blockId = String(ExploreRegistry.BLOCK.getKey(event.getState().getBlock()))
    if (!blockId.startsWith('tfc:wild_crop/')) return
    const rank = explorationRank(player, 'foraging')
    if (rank === 0 || player.getRandom().nextFloat() >= 0.1 * rank) return
    const drops = event.getDrops()
    for (let index = 0; index < drops.size(); index++) {
        const stack = drops.get(index).getItem()
        const itemId = String(ExploreRegistry.ITEM.getKey(stack.getItem()))
        if (itemId.startsWith('tfc:food/') && stack.getCount() < stack.getMaxStackSize()) {
            // Grow the actual drop to preserve its TFC food/decay components.
            stack.grow(1)
            break
        }
    }
})
