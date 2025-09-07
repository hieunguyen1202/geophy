import React, { useState, useEffect, type JSX } from 'react'; 
import AngleRight from '../../assets/icons/angle-right.svg';
import AngleLeft from '../../assets/icons/angle-left.svg';  
import Each from '../../layouts/Each';

export interface CarouselItem {
    id: number;
    image: string;
    title: string;
    excerpt: string;
}

interface CarouselProps {
    items?: CarouselItem[];
    children: (item: CarouselItem & { item?: CarouselItem }) => JSX.Element; // Include item in the type
}

const defaultItems = [
    {
        id: 1,
        image: "/api/placeholder/800/600",
        title: "First Slide",
        excerpt: "excerpt 1"
    },
    {
        id: 2,
        image: "/api/placeholder/800/600",
        title: "Second Slide",
        excerpt: "excerpt 2"
    },
    {
        id: 3,
        image: "/api/placeholder/800/600",
        title: "Third Slide",
        excerpt: "excerpt 3"
    },
    {
        id: 4,
        image: "/api/placeholder/800/600",
        title: "Fourth Slide",
        excerpt: "excerpt 4"
    }
];

const FullscreenCarousel: React.FC<CarouselProps> = ({ items = defaultItems, children }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(1);

    useEffect(() => {
        const updateItemsPerView = () => {
            const width = window.innerWidth;
            if (width < 640) setItemsPerView(1);
            else if (width < 768) setItemsPerView(2);
            else if (width < 1024) setItemsPerView(3);
            else setItemsPerView(4);
        };

        updateItemsPerView();
        window.addEventListener('resize', updateItemsPerView);
        return () => window.removeEventListener('resize', updateItemsPerView);
    }, []);

    const totalSlides = Math.ceil(items.length / itemsPerView);

    const handleNext = () => {
        setCurrentIndex(prev => (prev + 1) % totalSlides);
    };

    const handlePrev = () => {
        setCurrentIndex(prev => (prev - 1 + totalSlides) % totalSlides);
    };

    return (
        <div className='relative'> 
            <div className="relative w-full overflow-hidden">
                <div className="max-h-[394px] flex items-center">
                    <div className="w-full">
                        <div
                            className="flex transition-transform duration-500 ease-out gap-4 px-4"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                                <div key={slideIndex} className="flex gap-4 full:gap-[30px] min-w-full">
                                    {items
                                        .slice(
                                            slideIndex * itemsPerView,
                                            slideIndex * itemsPerView + itemsPerView
                                        )
                                        .map((item) => (
                                            <div
                                                key={item.id}
                                                className="relative flex-1 flex justify-center items-center"
                                                style={{ minWidth: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 16 / itemsPerView}px)` }}
                                            >
                                                {React.cloneElement(children(item), { item })} {/* No need for type assertion */}
                                            </div>
                                        ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className='sm:hidden flex justify-center items-center gap-2 mt-6'>
                    <Each
                        of={Array(5).fill(items.length)}
                        render={(item: number, index: number) =>  
                            <p 
                                onClick={() => setCurrentIndex(index)}
                                className={`${currentIndex === index ? "bg-secondary" : "bg-primary"} hidden w-3 h-3 rounded-full`}>
                                {item}
                            </p>  
                        }
                    />
                </div>  
            </div>
            
            <button 
                onClick={handlePrev}
                className={` 
                    xl:hidden absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 full:-translate-x-16 w-[52px] h-[52px] bg-white p-[10px] rounded-full border-2 border-primary text-primary flex items-center justify-center hover:opacity-70
                `}
            > 
                <img alt='angle left' src={AngleLeft} className='w-8 h-8' />
            </button>

            <button 
                onClick={handleNext}
                className={` 
                    xl:hidden absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 full:translate-x-16 w-[52px] h-[52px] bg-white p-[10px] rounded-full border-2 border-primary text-primary flex items-center justify-center hover:opacity-70
                `}
            >
                <img alt='angle right' src={AngleRight} className='w-8 h-8' /> 
            </button>
        </div>
    );
};

export default FullscreenCarousel;