// Run after TFC adds its combined weight/size line. Match translation keys,
// not English text. Replace TFC's weight category with the mod's formatted kg.
const TFCWeightTooltipContents = Java.loadClass('net.minecraft.network.chat.contents.TranslatableContents')
const TFCWeightTooltipPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const TFCWeightTooltipComponent = Java.loadClass('net.minecraft.network.chat.Component')
var tfcWeightTooltipErrorReported = false

function findTFCWeightTooltipPart(component, prefix) {
    var contents = component.getContents()
    if (contents instanceof TFCWeightTooltipContents && String(contents.getKey()).startsWith(prefix)) {
        return component
    }
    var siblings = component.getSiblings().toArray()
    for (var i = 0; i < siblings.length; i++) {
        var found = findTFCWeightTooltipPart(siblings[i], prefix)
        if (found !== null) return found
    }
    return null
}

NativeEvents.onEvent(
    TFCWeightTooltipPriority.LOWEST,
    'net.neoforged.neoforge.event.entity.player.ItemTooltipEvent',
    event => {
        try {
            var lines = event.getToolTip()
            var snapshot = lines.toArray()
            var tfcWeightPosition = -1
            var kilogramPosition = -1
            var tfcSizePart = null
            var kilogramPart = null
            for (var i = 0; i < snapshot.length; i++) {
                var line = snapshot[i]
                var foundKilograms = findTFCWeightTooltipPart(line, 'tooltip.wfweight.weight')
                if (foundKilograms !== null) {
                    kilogramPosition = i
                    kilogramPart = foundKilograms
                }
                if (findTFCWeightTooltipPart(line, 'tfc.enum.weight.') === null) continue
                var size = findTFCWeightTooltipPart(line, 'tfc.enum.size.')
                // Only replace a positively identified combined TFC line.
                // Never remove lines or mutate their shared component children.
                if (size !== null) {
                    lines.set(i, TFCWeightTooltipComponent.literal('↕ ')
                        .append(size.copy()).setStyle(line.getStyle()))
                    tfcWeightPosition = i
                    tfcSizePart = size
                }
            }
            // Ultimate Weight puts the formatted amount in translation arg 0.
            // Reuse it without the "Weight:" label on TFC's original row.
            if (tfcWeightPosition >= 0 && kilogramPosition >= 0) {
                var weightArgs = kilogramPart.getContents().getArgs()
                if (weightArgs.length > 0) {
                    var combinedLine = TFCWeightTooltipComponent.literal('⚖ ' + String(weightArgs[0]) + ' ↕ ')
                        .append(tfcSizePart.copy()).setStyle(snapshot[tfcWeightPosition].getStyle())
                    lines.set(tfcWeightPosition, combinedLine)
                    lines['remove(int)'](kilogramPosition)
                }
            }
        } catch (error) {
            // A tooltip API mismatch must leave normal tooltips available.
            if (!tfcWeightTooltipErrorReported) {
                tfcWeightTooltipErrorReported = true
                console.warn('TFC weight tooltip filter skipped: ' + error)
            }
        }
    }
)
