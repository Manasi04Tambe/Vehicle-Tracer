import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css'; 

import carPngImage from './car.png'

mapboxgl.accessToken = "pk.eyJ1IjoicGxhYmFkZTAyIiwiYSI6ImNtMm03ZnE2eTBkeHEya3M5ZnNlcXVqdTgifQ.witTInPpVnPfdiDG0NHuvA";

const App = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [data, setData] = useState([]);
  const [coordinates, setCoordinates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [73.852299, 18.517601],
        zoom: 13,
      });

      mapRef.current.on('load', () => {
        mapRef.current.addSource('path', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        mapRef.current.addLayer({
          id: 'path',
          type: 'line',
          source: 'path',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#FF0000',
            'line-width': 4,
          },
        });

        const carIcon = document.createElement('img');
        carIcon.src = carPngImage;
        carIcon.style.width = '32px';
        carIcon.style.height = '32px';

        markerRef.current = new mapboxgl.Marker({ element: carIcon })
          .setLngLat([73.852299, 18.517601])
          .addTo(mapRef.current);

        updateMarkerPosition();
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);


  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/vehicle');
        if (Array.isArray(response.data)) {
          setData(response.data);
          const selectedData = response.data.find(item => item.day === selectedDay);
          if (selectedData) {
            setCoordinates(selectedData.locations);
          }
        } else {
          console.error("Unexpected data format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
      }
    };

    fetchCoordinates();
  }, []);


  const updateMarkerPosition = () => {
    if (markerRef.current && coordinates[currentIndex]) {
      const { latitude, longitude } = coordinates[currentIndex];
      markerRef.current.setLngLat([longitude, latitude]);
    }
  };

  useEffect(() => {
    if (!isMoving || coordinates.length === 0 || currentIndex >= coordinates.length) return;

    const moveMarker = () => {
      updateMarkerPosition();

      const pathData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coordinates.slice(0, currentIndex + 1).map(coord => [coord.longitude, coord.latitude]),
            },
          },
        ],
      };

      mapRef.current.getSource('path').setData(pathData);

      const { latitude, longitude } = coordinates[currentIndex];

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        speed: 1.2,
        curve: 1,
        essential: true
      });

      setTimeout(() => setCurrentIndex(currentIndex + 1), 1000);
    };

    moveMarker();
  }, [coordinates, currentIndex, isMoving]);

  const handleStart = () => {
    const selectedData = data.find(item => item.day === selectedDay);
    if (selectedData) {
      setCoordinates(selectedData.locations);
      setCurrentIndex(0);
      setIsMoving(true);
    }
  };

  const handleStop = () => {
    setIsMoving(false);
  };

  const handleDayChange = (e) => {
    setSelectedDay(e.target.value);
    const selectedData = data.find(item => item.day === e.target.value);
    if (selectedData) {
      setCoordinates(selectedData.locations);
      setCurrentIndex(0);
    }
  };

  return (
    <div ref={mapContainerRef} id="map" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div className="overlay">
        <h1>Vehicle Tracker</h1>
        <div className="controls">
          <select value={selectedDay} onChange={handleDayChange}>
            {Array.isArray(data) && data.map((item) => (
              <option key={item.day} value={item.day}>{item.day}</option>
            ))}
          </select>
          <button onClick={handleStart}>Start</button>
          <button onClick={handleStop}>Stop</button>
        </div>
      </div>
    </div>
  );
};

export default App;