import { defineEventHandler, setResponseHeader } from 'h3'
import { resetDashboardState, dashboardState } from '../dashboard.js'

export default defineEventHandler(async (event) => {
    setResponseHeader(event, 'Content-Type', 'application/json')
    resetDashboardState()
    return { 
        success: true,
        state: dashboardState,
        message: 'Dashboard state has been reset'
    }
})
