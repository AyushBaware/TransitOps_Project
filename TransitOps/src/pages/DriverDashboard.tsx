import React from "react";
import { useApp } from "../context/AppContext";
import {
  Truck,
  MapPin,
  Clock,
  Bell,
  Wrench,
  Fuel,
} from "lucide-react";

export const DriverDashboard: React.FC = () => {

  const { currentUser, trips, notifications } = useApp();

  const myTrip = trips.find(
    trip => trip.status === "Dispatched"
  );

  return (

    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Welcome,
          {" "}
          {currentUser?.name}
        </h1>

        <p className="text-gray-500">
          Driver Operations Dashboard
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">

        <div className="bg-white rounded-xl shadow p-5">

          <Truck className="mb-3 text-blue-600"/>

          <h2 className="font-bold">
            Assigned Vehicle
          </h2>

          <p className="text-gray-500">
            MH-12-AB-1234
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-5">

          <MapPin className="mb-3 text-green-600"/>

          <h2 className="font-bold">
            Destination
          </h2>

          <p className="text-gray-500">

            {myTrip
              ? myTrip.destination
              : "No Active Trip"}

          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-5">

          <Clock className="mb-3 text-orange-600"/>

          <h2 className="font-bold">
            Trip Status
          </h2>

          <p className="text-gray-500">

            {myTrip
              ? myTrip.status
              : "Waiting"}

          </p>

        </div>

      </div>

      <div className="grid md:grid-cols-2 gap-5">

        <div className="bg-white rounded-xl shadow p-5">

          <h2 className="font-bold mb-4">
            Quick Actions
          </h2>

          <div className="space-y-3">

            <button
              className="w-full bg-blue-600 text-white p-3 rounded-lg flex items-center gap-3">

              <Fuel size={18}/>
              Request Fuel

            </button>

            <button
              className="w-full bg-orange-600 text-white p-3 rounded-lg flex items-center gap-3">

              <Wrench size={18}/>
              Report Maintenance

            </button>

          </div>

        </div>

        <div className="bg-white rounded-xl shadow p-5">

          <h2 className="font-bold mb-4 flex items-center gap-2">

            <Bell size={18}/>

            Notifications

          </h2>

          <div className="space-y-3">

            {notifications.slice(0,5).map(item=>(
              <div
                key={item.id}
                className="border rounded-lg p-3">

                {item.message}

              </div>
            ))}

          </div>

        </div>

      </div>

    </div>

  );

};