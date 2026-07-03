import { MapPin, Car, UtensilsCrossed, BedDouble, Lightbulb, Footprints, BusFront, TrainFront, Plane, Ship } from 'lucide-react'

/* Labels live in the i18n dictionaries (labelKey resolved at render time
   with t()): a module-level string would freeze the boot language. */

/* transport modes for `drive` items */
export const MODE_META = {
  car: { labelKey: 'modes.car', Icon: Car },
  walk: { labelKey: 'modes.walk', Icon: Footprints },
  bus: { labelKey: 'modes.bus', Icon: BusFront },
  train: { labelKey: 'modes.train', Icon: TrainFront },
  plane: { labelKey: 'modes.plane', Icon: Plane },
  boat: { labelKey: 'modes.boat', Icon: Ship },
}

/* effective icon/label for an item, considering the transport mode of drives */
export function itemMeta(item) {
  const base = TYPE_META[item.type] ?? TYPE_META.activity
  if (item.type !== 'drive') return base
  const mode = MODE_META[item.mode] ?? MODE_META.car
  return { ...base, Icon: mode.Icon, labelKey: mode.labelKey }
}

/* Visual identity of each activity type (light theme) */
export const TYPE_META = {
  activity: {
    labelKey: 'types.activity',
    Icon: MapPin,
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    dot: 'bg-amber-100 text-amber-600 ring-amber-200',
  },
  drive: {
    labelKey: 'types.drive',
    Icon: Car,
    chip: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    dot: 'bg-sky-100 text-sky-600 ring-sky-200',
  },
  food: {
    labelKey: 'types.food',
    Icon: UtensilsCrossed,
    chip: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    dot: 'bg-rose-100 text-rose-600 ring-rose-200',
  },
  hotel: {
    labelKey: 'types.hotel',
    Icon: BedDouble,
    chip: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    dot: 'bg-violet-100 text-violet-600 ring-violet-200',
  },
  info: {
    labelKey: 'types.info',
    Icon: Lightbulb,
    chip: 'bg-teal-50 text-teal-700 ring-teal-600/20',
    dot: 'bg-teal-100 text-teal-600 ring-teal-200',
  },
}
