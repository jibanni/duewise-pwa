import { sendRemindersForSlot } from './send-reminders.mjs'

export default function handler(request, response) {
  return sendRemindersForSlot('evening', request, response)
}
