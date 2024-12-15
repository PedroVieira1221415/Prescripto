import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify';

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [dtoken, setDtoken] = useState(localStorage.getItem('dtoken') ? localStorage.getItem('dtoken') : '')
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false);
    const [profileData, setProfileData] = useState(false);

    const getAppointments = async () => {
        try {
            const {data} = await axios.get(`${backendUrl}/api/doctor/appointments`, {headers:{dtoken}})
            if(data.success){
                setAppointments(data.appointments)
                console.log(data.appointments);
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error); 
            toast.error(error.message)
        }
    }

    const completeAppointment = async (appointmentId) => {
        try {
            const {data} = await axios.post(`${backendUrl}/api/doctor/complete-appointment`, {appointmentId}, {headers:{dtoken}})
            if(data.success){
                getAppointments()
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const {data} = await axios.post(`${backendUrl}/api/doctor/cancel-appointment`, {appointmentId}, {headers:{dtoken}})
            if(data.success){
                getAppointments()
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }
    
    const getDashData = async () => {
        try {
            const {data} = await axios.get(`${backendUrl}/api/doctor/dashboard`, {headers:{dtoken}})
            if(data.success){
                setDashData(data.dashData)
                console.log(data.dashData);
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }

    }

    const getProfileData = async () => {
        try {
            const {data} = await axios.get(`${backendUrl}/api/doctor/profile`, {headers:{dtoken}})
            if(data.success){
                setProfileData(data.profileData)
                console.log(data.profileData);
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const value = {
        dtoken,
        setDtoken,
        backendUrl,
        appointments,
        setAppointments,
        getAppointments,
        completeAppointment,
        cancelAppointment,
        dashData,
        setDashData,
        getDashData,
        getProfileData,
        profileData,
        setProfileData
    }

    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )
}

export default DoctorContextProvider;