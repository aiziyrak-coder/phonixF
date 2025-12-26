import React from 'react';

const ScrollingBanner: React.FC = () => {
  const bannerText = "DIQQAT! Phoenix Ilmiy Nashriyot Markazining yangi platformasi sinov (demo) rejimida ishlamoqda. Taklif va kamchiliklar yuzasidan murojaat uchun telefon: +998 (94) 743-09-12";
  return (
    <div className="scrolling-banner-container" aria-live="polite">
      <div className="scrolling-banner-inner">
        <span>{bannerText}</span>
        <span aria-hidden="true">{bannerText}</span>
      </div>
    </div>
  );
};

export default ScrollingBanner;
