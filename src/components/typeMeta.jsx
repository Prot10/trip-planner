import { MapPin, Car, UtensilsCrossed, BedDouble, Lightbulb } from 'lucide-react'

/* Visual identity of each activity type (light theme) */
export const TYPE_META = {
  activity: {
    label: 'Tappa',
    Icon: MapPin,
    chip: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    dot: 'bg-amber-100 text-amber-600 ring-amber-200',
  },
  drive: {
    label: 'Guida',
    Icon: Car,
    chip: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    dot: 'bg-sky-100 text-sky-600 ring-sky-200',
  },
  food: {
    label: 'Cibo',
    Icon: UtensilsCrossed,
    chip: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    dot: 'bg-rose-100 text-rose-600 ring-rose-200',
  },
  hotel: {
    label: 'Hotel',
    Icon: BedDouble,
    chip: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    dot: 'bg-violet-100 text-violet-600 ring-violet-200',
  },
  info: {
    label: 'Info',
    Icon: Lightbulb,
    chip: 'bg-teal-50 text-teal-700 ring-teal-600/20',
    dot: 'bg-teal-100 text-teal-600 ring-teal-200',
  },
}
