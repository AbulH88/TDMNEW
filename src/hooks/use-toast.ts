import { useState, useEffect } from "react";

// simple toast system
// we just keep a global list of toasts and notify listeners
let listeners: any[] = [];
let toasts: any[] = [];

function notify() {
  for (let i = 0; i < listeners.length; i++) {
    listeners[i]([...toasts]);
  }
}

// export a simple toast function
export function toast(props: any) {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast = { ...props, id, open: true };
  
  // add to list
  toasts.push(newToast);
  if (toasts.length > 5) toasts.shift(); // only keep last 5
  
  notify();
  
  // auto remove after 5 seconds
  setTimeout(function() {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, 5000);

  return {
    id: id,
    dismiss: () => {
        toasts = toasts.filter(t => t.id !== id);
        notify();
    }
  };
}

// hook to use in components
export function useToast() {
  const [state, setState] = useState(toasts);

  useEffect(function() {
    listeners.push(setState);
    return function() {
        listeners = listeners.filter(l => l !== setState);
    };
  }, []);

  return {
    toasts: state,
    toast: toast,
    dismiss: (id?: string) => {
        if (id) toasts = toasts.filter(t => t.id !== id);
        else toasts = [];
        notify();
    }
  };
}
