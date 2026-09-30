export async function captureScene(viewport: HTMLElement): Promise<string> {
  const canvas = viewport.querySelector('canvas');
  if (canvas) return canvas.toDataURL('image/png');

  const svg = viewport.querySelector('svg');
  if (!svg) throw new Error('The room view is not available.');
  let { width, height } = svg.getBoundingClientRect();
  if (width < 1 || height < 1) throw new Error('The room view is too small to export.');
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const originals = [svg, ...svg.querySelectorAll<SVGElement>('*')];
  const copies = [clone, ...clone.querySelectorAll<SVGElement>('*')];
  for (let i = 0; i < originals.length; i++) {
    const style = getComputedStyle(originals[i]);
    for (const property of ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'opacity', 'visibility']) {
      const value = style.getPropertyValue(property).replace(/url\(["']?[^)"']*#([^)"']+)["']?\)/g, 'url(#$1)');
      copies[i].style.setProperty(property, value);
    }
  }
  clone.querySelectorAll('[data-export-ignore]').forEach(element => element.remove());
  const room = clone.querySelector<SVGGElement>('[data-floorplan-room]');
  if (!room) throw new Error('The floorplan is not available.');
  room.removeAttribute('transform');
  // Measure the complete room and dimension labels, independently of viewport pan and zoom.
  clone.style.position = 'fixed';
  clone.style.opacity = '0';
  document.body.appendChild(clone);
  let bounds: DOMRect;
  try { bounds = room.getBBox(); } finally { clone.remove(); }
  const padding = 24;
  const exportWidth = bounds.width + padding * 2;
  const exportHeight = bounds.height + padding * 2;
  const scale = Math.min(2, 2048 / Math.max(exportWidth, exportHeight));
  width = Math.ceil(exportWidth * scale);
  height = Math.ceil(exportHeight * scale);
  clone.setAttribute('viewBox', `${bounds.x - padding} ${bounds.y - padding} ${exportWidth} ${exportHeight}`);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.removeProperty('position');
  clone.style.removeProperty('opacity');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The floorplan image could not be generated.'));
      image.src = url;
    });
    const output = document.createElement('canvas');
    output.width = Math.round(width);
    output.height = Math.round(height);
    const context = output.getContext('2d');
    if (!context) throw new Error('Image export is unavailable in this browser.');
    context.fillStyle = '#0A0D14';
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(image, 0, 0, output.width, output.height);
    return output.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
