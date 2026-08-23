"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/products-db";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] || images[0];

  if (!activeImage) return null;

  return (
    <div className="product-gallery" aria-label={`${productName} image gallery`}>
      <div className="product-gallery__main" aria-live="polite">
        <Image alt={activeImage.alt} fill priority sizes="(max-width: 860px) 100vw, 50vw" src={activeImage.src} style={{ objectFit: "contain" }} />
      </div>
      {images.length > 1 ? (
        <div className="product-gallery__thumbs" aria-label={`Select a ${productName} image`} role="group">
          {images.map((image, index) => (
            <button
              aria-label={`Show ${image.alt}`}
              aria-pressed={activeIndex === index}
              className="product-gallery__thumb"
              key={`${image.src}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image alt="" fill sizes="160px" src={image.src} style={{ objectFit: "contain" }} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
