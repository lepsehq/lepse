/**
 * Shake an element in all axises
 * @param el The element to animate
 * @param intensity The amount the shake will travel ( 0 - `intensity` )
 */
export function shake(el: HTMLElement, intensity: number = 4) {
  let raf: number
  let skipFrame = false // animate only the other frame as to make the effect jittery

  const r = () => {
    skipFrame = !skipFrame
    if (!skipFrame) {
      // compute a number from -x ~ +x
      const c = (n: number) => (Math.random() * 2 - 1) * n
      el.style.transform = `translate3d(${c(intensity)}px, ${c(intensity)}px, 0)`
    }

    raf = requestAnimationFrame(r)
  }
  raf = requestAnimationFrame(r)

  const stop = () => {
    cancelAnimationFrame(raf)
    el.style.transform = ''
  }
  return stop
}
