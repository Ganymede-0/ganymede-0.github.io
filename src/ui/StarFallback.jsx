// The entire loading state: one star, breathing, on black.
//
// This is a Suspense *fallback*, not a boot screen — there is no timer, no
// progress bar, and no minimum hold. The site renders the moment it can; if
// nothing suspends, this never appears at all. That's the point: a hiring
// manager with thirty seconds should never be made to wait for a animation
// that exists only to be admired.
export default function StarFallback() {
  return (
    <div className="star-fallback" role="status" aria-label="Loading">
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        {/* A four-point sparkle — concave sides, so it reads as a star rather
            than a plus sign at this size. */}
        <path
          d="M12 0 C12.6 7.2 16.8 11.4 24 12 C16.8 12.6 12.6 16.8 12 24 C11.4 16.8 7.2 12.6 0 12 C7.2 11.4 11.4 7.2 12 0 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}
