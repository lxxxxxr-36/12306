import React, { useCallback, useEffect, useState } from 'react';
import './Carousel.css';

interface CarouselItem {
  image: string;
  link?: string;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  interval?: number;
}

const Carousel: React.FC<CarouselProps> = ({ 
  items, 
  autoPlay = true, 
  interval = 3000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(1); // Start at first real item
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Clone first and last items for seamless loop
  const extendedItems = [
    items[items.length - 1], // Clone of last item at beginning
    ...items,
    items[0] // Clone of first item at end
  ];

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => {
      const nextIndex = prev + 1;
      
      setTimeout(() => {
        if (nextIndex === items.length + 1) {
          // Jump to actual first item without transition
          setIsTransitioning(false);
          setCurrentIndex(1);
        } else {
          setIsTransitioning(false);
        }
      }, 500);
      
      return nextIndex;
    });
  }, [isTransitioning, items.length]);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      nextSlide();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, nextSlide]);

  const prevSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => {
      const prevIndex = prev - 1;
      
      setTimeout(() => {
        if (prevIndex === 0) {
          // Jump to actual last item without transition
          setIsTransitioning(false);
          setCurrentIndex(items.length);
        } else {
          setIsTransitioning(false);
        }
      }, 500);
      
      return prevIndex;
    });
  };

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index + 1); // +1 because of cloned first item
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const translateX = -currentIndex * 100;

  return (
    <div className="carousel-container">
      <div className="carousel-wrapper">
        <div 
          className="carousel-track"
          style={{
            transform: `translateX(${translateX}%)`,
            transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none'
          }}
        >
          {extendedItems.map((item, index) => (
            <div key={index} className="carousel-slide">
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  <img src={item.image} alt={`Banner ${index}`} />
                </a>
              ) : (
                <img src={item.image} alt={`Banner ${index}`} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation arrows */}
      <button className="carousel-nav carousel-nav-prev" onClick={prevSlide} title="上一张">
      </button>
      <button className="carousel-nav carousel-nav-next" onClick={nextSlide} title="下一张">
      </button>
      
      {/* Indicators */}
      <div className="carousel-indicators">
        {items.map((_, index) => (
          <button
            key={index}
            className={`carousel-indicator ${
              (currentIndex === 0 && index === items.length - 1) ||
              (currentIndex === items.length + 1 && index === 0) ||
              (currentIndex - 1 === index)
                ? 'active' 
                : ''
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;