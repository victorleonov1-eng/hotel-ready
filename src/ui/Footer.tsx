export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="text-center text-sm text-gray-500 py-4 mt-auto border-t border-gray-200">
      A <span className="text-crimson font-medium">Hotel Consult</span> product — Support and Advice. © {year} All rights reserved.
    </footer>
  );
}
