import BookingJourneyCard from "./BookingJourneyCard";
import BookingsSectionHeader from "./BookingsSectionHeader";
import BookingsStatePanel from "./BookingsStatePanel";

export default function BookingsJourneyList({
  bookings,
  loading,
  cancellingId,
  onCancel,
}) {
  return (
    <section className="space-y-5">
      <BookingsSectionHeader
        title="Upcoming Journeys"
        subtitle="Your most recent train reservations and payment-confirmed trips."
      />

      {loading ? (
        <BookingsStatePanel message="Loading your bookings..." />
      ) : bookings.length === 0 ? (
        <BookingsStatePanel message="No train bookings found yet." />
      ) : (
        <div className="grid gap-5 px-1 md:px-2 xl:grid-cols-2">
          {bookings.map((booking) => (
            <BookingJourneyCard
              key={booking._id}
              booking={booking}
              onCancel={onCancel}
              cancelling={cancellingId === booking._id}
            />
          ))}
        </div>
      )}
    </section>
  );
}