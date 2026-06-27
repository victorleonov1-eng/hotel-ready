/**
 * Test helpers for simulating user interactions in a React-aware way
 */

/**
 * Simulate typing into a controlled React input
 * This properly triggers onChange events that React expects
 */
export function simulateInput(
  element: HTMLInputElement,
  value: string,
  delay: number = 50
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;

    const type = () => {
      if (index < value.length) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(element, value.substring(0, index + 1));

          // Trigger input event (React listens to this)
          element.dispatchEvent(
            new Event('input', { bubbles: true, composed: true })
          );
          element.dispatchEvent(
            new Event('change', { bubbles: true, composed: true })
          );
        }

        index++;
        setTimeout(type, delay);
      } else {
        resolve();
      }
    };

    type();
  });
}

/**
 * Click a button and wait for the DOM to update
 */
export function clickButton(button: HTMLButtonElement | null): Promise<void> {
  return new Promise((resolve) => {
    if (button) {
      button.click();
      // Wait for React to process the click
      setTimeout(() => resolve(), 100);
    } else {
      resolve();
    }
  });
}

/**
 * Get button by visible text content
 */
export function getButtonByText(text: string): HTMLButtonElement | null {
  return Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent?.includes(text)
  ) as HTMLButtonElement | null;
}

/**
 * Get input by placeholder or nearby label text
 */
export function getInputByLabel(label: string): HTMLInputElement | null {
  const labels = Array.from(document.querySelectorAll('label'));
  const labelElement = labels.find((l) => l.textContent?.includes(label));

  if (labelElement) {
    const inputId = labelElement.getAttribute('for');
    if (inputId) {
      return document.getElementById(inputId) as HTMLInputElement | null;
    }
  }

  return null;
}

/**
 * Wait for element to appear in the DOM
 */
export function waitForElement(
  selector: string,
  timeout: number = 3000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        resolve(null);
      } else {
        requestAnimationFrame(check);
      }
    };

    check();
  });
}

/**
 * Wait for text to appear on page
 */
export function waitForText(
  text: string,
  timeout: number = 3000
): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const check = () => {
      if (document.body.textContent?.includes(text)) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        resolve(false);
      } else {
        requestAnimationFrame(check);
      }
    };

    check();
  });
}
