import React, { useState } from 'react'
import { GoogleMap, LoadScript, Marker, Polyline, Autocomplete } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100vh'
}

const center = {
  lat: 12.9716,
  lng: 77.5946
}

const apiKey = import.meta.env.VITE_MAPS_API_KEY

const colors = ['#FF0000', '#00AA00', '#FFA500', '#800080', '#008080', '#000000']

const HomePage = () => {
  const [formData, setFormData] = useState({
    departure_time: '',
    userId: '',
    userName: ''
  })
  const [pickup, setPickup] = useState(null)
  const [drop, setDrop] = useState(null)
  const [route, setRoute] = useState([])
  const [pickupAutocomplete, setPickupAutocomplete] = useState(null)
  const [dropAutocomplete, setDropAutocomplete] = useState(null)
  const [tripId, setTripId] = useState(null)
  const [matchList, setMatchList] = useState([])

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const onPickupPlaceChanged = () => {
    if (pickupAutocomplete) {
      const place = pickupAutocomplete.getPlace()
      if (place.geometry) {
        setPickup({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        })
      }
    }
  }

  const onDropPlaceChanged = () => {
    if (dropAutocomplete) {
      const place = dropAutocomplete.getPlace()
      if (place.geometry) {
        setDrop({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        })
      }
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (!pickup || !drop) return
      const payload = {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        departure_time: formData.departure_time,
        userId: formData.userId,
        userName: formData.userName
      }
      const res = await fetch('http://localhost:5000/trip/create-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.trip && data.trip.route_coordinates) {
        const coords = data.trip.route_coordinates.map(c => ({ lat: c[0], lng: c[1] }))
        setRoute(coords)
        setTripId(data.trip.tripId)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleFindMatches = async () => {
    if (!tripId) return
    try {
      const res = await fetch(`http://localhost:5000/trip/matches/${tripId}`)
      const data = await res.json()
      if (data.matches && data.matches.length > 0) {
        setMatchList(data.matches)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={['places']}>
      <div className="flex">
        <div className="w-1/3 p-6 bg-gray-100 min-h-screen overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md space-y-4">
            <Autocomplete onLoad={ac => setPickupAutocomplete(ac)} onPlaceChanged={onPickupPlaceChanged}>
              <input type="text" placeholder="Pickup Address" className="w-full px-4 py-2 border rounded-lg" />
            </Autocomplete>
            <Autocomplete onLoad={ac => setDropAutocomplete(ac)} onPlaceChanged={onDropPlaceChanged}>
              <input type="text" placeholder="Drop Address" className="w-full px-4 py-2 border rounded-lg" />
            </Autocomplete>
            <input type="datetime-local" name="departure_time" value={formData.departure_time} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" name="userId" placeholder="User ID" value={formData.userId} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" name="userName" placeholder="User Name" value={formData.userName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Create Trip</button>
          </form>
          <button
            onClick={handleFindMatches}
            disabled={!tripId}
            className={`w-full mt-4 py-2 rounded-lg ${tripId ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
          >
            Find Similar Paths
          </button>
          {matchList.length > 0 && (
            <div className="mt-6 space-y-4">
              {matchList.map((m, idx) => (
                <div key={idx} className="p-4 bg-white rounded-xl shadow-md flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Pickup: {m.pickup_address}</p>
                    <p className="text-sm font-medium text-gray-700">Drop: {m.drop_address}</p>
                    <p className="text-sm text-gray-500">Departure: {new Date(m.departure_time).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Match: {m.match_percentage}%</p>
                  </div>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="w-2/3">
          <GoogleMap mapContainerStyle={containerStyle} center={pickup || center} zoom={10}>
            {pickup && <Marker position={pickup} />}
            {drop && <Marker position={drop} />}
            {route.length > 0 && <Polyline path={route} options={{ strokeColor: '#0000FF', strokeWeight: 4 }} />}
            {matchList.map((m, idx) => (
              <Polyline key={idx} path={m.route_coordinates.map(c => ({ lat: c[0], lng: c[1] }))} options={{ strokeColor: colors[idx % colors.length], strokeWeight: 3 }} />
            ))}
          </GoogleMap>
        </div>
      </div>
    </LoadScript>
  )
}

export default HomePage;