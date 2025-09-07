import { 
    Book as BookIcon,
    Science as ScienceIcon
} from '@mui/icons-material';

export const subjectConfig = {
  0: {
    title: 'Toán học',
    path: '/resource/math',
    icon: <BookIcon className="text-2xl" />,
    color: 'bg-gradient-to-r from-blue-600 to-purple-600',
    accentColor: 'from-blue-50 to-purple-50'
  },
  1: {
    title: 'Vật lý',
    path: '/resource/physics',
    icon: <ScienceIcon className="text-2xl" />,
    color: 'bg-gradient-to-r from-green-600 to-teal-600',
    accentColor: 'from-green-50 to-teal-50'
  },
}; 