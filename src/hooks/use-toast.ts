import * as React from "react"

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

interface State {
  toasts: ToasterToast[]
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const newToast: ToasterToast = {
    ...props,
    id,
  }

  memoryState = {
    ...memoryState,
    toasts: [newToast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
  }

  listeners.forEach((listener) => {
    listener(memoryState)
  })

  // Auto-dismiss after delay
  setTimeout(() => {
    memoryState = {
      ...memoryState,
      toasts: memoryState.toasts.filter((t) => t.id !== id),
    }
    listeners.forEach((listener) => {
      listener(memoryState)
    })
  }, TOAST_REMOVE_DELAY)

  return {
    id: id,
    dismiss: () => {
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.filter((t) => t.id !== id),
      }
      listeners.forEach((listener) => {
        listener(memoryState)
      })
    },
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        memoryState = {
          ...memoryState,
          toasts: memoryState.toasts.filter((t) => t.id !== toastId),
        }
      } else {
        memoryState = { ...memoryState, toasts: [] }
      }
      listeners.forEach((listener) => {
        listener(memoryState)
      })
    },
  }
}

export { useToast, toast }
