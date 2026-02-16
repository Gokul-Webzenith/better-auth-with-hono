"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

import { ConfirmDialog } from "@/components/ConfirmDialog";

import { format, formatISO } from "date-fns";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { useUIStore } from "@repo/store";
import { todoFormSchema, type TodoForm } from "@repo/schemas";


type Todo = {
  id: number;
  text: string;
  description: string;
  status: "todo" | "backlog" | "inprogress" | "done" | "cancelled";
  startAt: string;
  endAt: string;
};


const API_URL = "/api";
 


 
const api = {
  getTodos: async (): Promise<Todo[]> => {
    const res = await fetch(API_URL,{
     credentials: 'include',
    });
   if (res.status === 401) {
  throw new Error("UNAUTHORIZED");
}


    if (!res.ok) throw new Error("Failed to fetch todos");
    return res.json();
  },

  addTodo: async (data: any) => {
    const res = await fetch(API_URL, {
      credentials: 'include',
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to add todo");

    return res.json();
  },

  updateTodo: async (id: number, data: any) => {
    const res = await fetch(`${API_URL}/${id}`, {
      credentials: 'include',
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update todo");

    return res.json();
  },

  patchTodo: async (id: number, data: Partial<Todo>) => {
    const res = await fetch(`${API_URL}/${id}`, {
      credentials: 'include',
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to patch todo");

    return res.json();
  },

  deleteTodo: async (id: number) => {
    
    const res = await fetch(`${API_URL}/${id}`, {
      credentials: 'include',
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete todo");

    return res.json();
  },
};


export default function WorkPage() {
  const queryClient = useQueryClient();

 const router = useRouter()

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Logout failed")

      return res.json()
    },

    onSuccess: () => {
      router.push("/") 
    },
  })


useEffect(() => {
  fetch("/api/me", {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.role === "admin") {
        router.push("/admin");
      }
    });
}, []);


const {
  expandedId,
  setExpandedId,

  openConfirm,
  closeConfirm,
  confirm,
  editTodo,
  sheetOpen,
  openSheet,
  closeSheet,
  setEditTodo,
  clearEditTodo,
  descOpen,
  activeTodo,
  openDesc,
  closeDesc,
} = useUIStore();

const {
  data: items = [],
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ["todos"],
  queryFn: api.getTodos,
});

useEffect(() => {
  if (isError && (error as Error)?.message === "UNAUTHORIZED") {
    router.push("/");
  }
}, [isError, error, router]);




  const addMutation = useMutation({
    mutationFn: api.addTodo,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) =>
      api.updateTodo(id, data),

    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: any) =>
      api.patchTodo(id, data),

    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteTodo,

    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });


  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TodoForm>({
    resolver: zodResolver(todoFormSchema),

    defaultValues: {
      text: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      status: "todo",
    },
  });


  const onSubmit = (data: TodoForm) => {
    openConfirm(editTodo ? "edit" : "add", data);
  };

  const processSubmit = (data: TodoForm) => {
    const startAt = formatISO(
      new Date(`${data.startDate}T${data.startTime}`)
    );

    const endAt = formatISO(
      new Date(`${data.endDate}T${data.endTime}`)
    );

    if (!editTodo) {
      addMutation.mutate({
        text: data.text,
        description: data.description,
        startAt,
        endAt,
        status: data.status,
      });
    } 
    else {
      updateMutation.mutate({
        id: editTodo.id,
        data: {
          ...editTodo,
          ...data,
          startAt,
          endAt,
        },
      });
    }

    reset();
    closeSheet();
  };

  const handleConfirm = () => {
    const { action, payload } = confirm;

    if (action === "delete") {
      deleteMutation.mutate(payload);
    }

    if (action === "add" || action === "edit") {
      processSubmit(payload);
    }

    closeConfirm();
  };

  const onDragStart = (
    e: React.DragEvent,
    id: number
  ) => {
    e.dataTransfer.setData("taskId", String(id));
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (
    e: React.DragEvent,
    status: Todo["status"]
  ) => {
    e.preventDefault();

    const id = Number(
      e.dataTransfer.getData("taskId")
    );

    patchMutation.mutate({
      id,
      data: { status },
    });
  };

const getRemainingClass = (
  endAt: string,
  status: string
) => {
  if (status !== "inprogress") {
    return "bg-white";
  }

  const now = Date.now();
  const end = new Date(endAt).getTime();

  const hoursLeft =
    (end - now) / (1000 * 60 * 60);

  if (hoursLeft <= 0) {
    return "bg-red-500 text-white";
  }

  if (hoursLeft < 2) {
    return "bg-red-200";
  }

  if (hoursLeft < 6) {
    return "bg-yellow-200";
  }

  return "bg-white-100";
};


  if (isLoading)
    return <div className="p-6">Loading...</div>;

  if (isError)
    return (
      <div className="p-6 text-red-600">
        {(error as Error).message}
      </div>
    );


  const byStatus = (s: Todo["status"]) =>
    items.filter((i) => i.status === s);


  const TaskCard = ({ item }: { item: Todo }) => {
    const isExpanded = expandedId === item.id;

    return (
      
      <div
        draggable
        onDragStart={(e) =>
          onDragStart(e, item.id)
        }
        onClick={() => {
  openDesc(item);
}}

        
        className={`border rounded-xl p-4 mb-3 shadow hover:shadow-md overflow-hidden cursor-pointer
        ${getRemainingClass(
          item.endAt,
          item.status
        )}`}
      >
        <p className="font-semibold">
          {item.text}
        </p>

        <p className="text-sm text-gray-600 mt-1 break-words whitespace-pre-wrap">

          {isExpanded
            ? item.description
            : item.description.slice(0, 60) +
              "..."}
        </p>

        <p className="text-xs text-gray-500 mt-2">
          {new Date(
            item.startAt
          ).toLocaleString()}{" "}
          →{" "}
          {new Date(
            item.endAt
          ).toLocaleString()}
        </p>

        <div
          className="flex gap-2 mt-3"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <Button
  size="sm"
  className="bg-blue-500 text-white"
  onClick={() => {
    setEditTodo(item);
    openSheet(); 

    const s = new Date(item.startAt);
    const e = new Date(item.endAt);

    setValue("text", item.text);
    setValue("description", item.description);
    setValue("startDate", format(s, "yyyy-MM-dd"));
    setValue("startTime", format(s, "HH:mm"));
    setValue("endDate", format(e, "yyyy-MM-dd"));
    setValue("endTime", format(e, "HH:mm"));
    setValue("status", item.status);
  }}
>
  Edit
</Button>


          <Button
            size="sm"
            className="bg-red-500 text-white"
            onClick={() =>
              openConfirm(
                "delete",
                item.id
              )
            }
          >
            Delete
          </Button>
        </div>
      </div>
    );
  };

  const today = new Date();
today.setHours(0, 0, 0, 0); 




  return (
    <>
     <button onClick={() => logoutMutation.mutate()} className="bg-black  text-white p-3 mt-10 ml-4">
      Logout
    </button>

      <div className="flex justify-end">
        <Sheet
  open={sheetOpen}
  onOpenChange={(open) => {
    if (open) openSheet();
    else closeSheet();
  }}
>

         <SheetTrigger asChild>
  <Button
    onClick={() => {
      reset();
      clearEditTodo();
      openSheet();
    }}
  >
    Add Todo
  </Button>
</SheetTrigger>



          <SheetContent
            side="right"
            className="w-[420px]"
          >
            <SheetHeader>
              <SheetTitle>
                {editTodo
                  ? "Edit Todo"
                  : "Add Todo"}
              </SheetTitle>
            </SheetHeader>

           <form
  onSubmit={handleSubmit(onSubmit)}
  className="space-y-6 mt-6"
>
 
  <div className="space-y-1">
    <label className="text-sm font-medium">
      Title
    </label>

    <input
      {...register("text")}
      placeholder="Enter task title"
      className="input w-full"
    />

    {errors.text && (
      <p className="text-xs text-red-500">
        {errors.text.message}
      </p>
    )}
  </div>


  <div className="space-y-1">
    <label className="text-sm font-medium">
      Description
    </label>

    <textarea
      {...register("description")}
      placeholder="Enter task details"
      className="input w-full min-h-[90px]"
    />

    {errors.description && (
      <p className="text-xs text-red-500">
        {errors.description.message}
      </p>
    )}
  </div>


  <div className="space-y-1">
    <label className="text-sm font-medium">
      Status
    </label>

    <select
      {...register("status")}
      className="input w-full"
    >
      <option value="todo">Todo</option>
      <option value="backlog">Backlog</option>
      <option value="inprogress">In Progress</option>
      <option value="done">Done</option>
      <option value="cancelled">Cancelled</option>
    </select>
  </div>


  <div className="space-y-2">
    <label className="text-sm font-medium">
      Start Date & Time
    </label>

    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          
          className="w-full justify-start"
        >
          {watch("startDate")
            ? format(
                new Date(watch("startDate")),
                "PPP"
              )
            : "Pick start date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent>
        <Calendar
          mode="single"
          selected={
            watch("startDate")
              ? new Date(watch("startDate"))
              : undefined
          }
          onSelect={(d) =>
            d &&
            setValue(
              "startDate",
              format(d, "yyyy-MM-dd")
            )
          }
            disabled={(date) => date < today}
        />
      </PopoverContent>
    </Popover>

    <input
      type="time"
      {...register("startTime")}
      className="input w-full"
    />
  </div>

  <div className="space-y-2">
    <label className="text-sm font-medium">
      End Date & Time
    </label>

    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
        >
          {watch("endDate")
            ? format(
                new Date(watch("endDate")),
                "PPP"
              )
            : "Pick end date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent>
        <Calendar
          mode="single"
          selected={
            watch("endDate")
              ? new Date(watch("endDate"))
              : undefined
          }
          onSelect={(d) =>
            d &&
            setValue(
              "endDate",
              format(d, "yyyy-MM-dd")
              
            )
          }
            disabled={(date) => date < today}
        />
      </PopoverContent>
    </Popover>

    <input
      type="time"
      {...register("endTime")}
      className="input w-full"
    />
  </div>

 
  <Button
    type="submit"
    className="w-full bg-indigo-600 hover:bg-indigo-700"
  >
    {editTodo ? "Update Task" : "Add Task"}
  </Button>
</form>

          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6 bg-gray-50 p-4 rounded-xl">
        {(
          [
            "todo",
            "backlog",
            "inprogress",
            "done",
            "cancelled",
          ] as Todo["status"][]
        ).map((s) => (
          <div
            key={s}
            className="bg-white rounded-xl p-4 shadow"
            onDragOver={allowDrop}
            onDrop={(e) => onDrop(e, s)}
          >
            <h3 className="font-semibold mb-3 capitalize">
              {s}
            </h3>

            {byStatus(s).map((item) => (
              <TaskCard
                key={item.id}
                item={item}
              />
            ))}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirm.open}
        title="Confirm Action"
        message="Are you sure?"
        onClose={closeConfirm}
        onConfirm={handleConfirm}
      />
      <Dialog open={descOpen} onOpenChange={closeDesc}>
 <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">

    <DialogHeader>
      <DialogTitle>
        {activeTodo?.text}
      </DialogTitle>
    </DialogHeader>

    <div className="mt-3 space-y-3">
      <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">

        {activeTodo?.description}
      </p>

      <p className="text-xs text-gray-400">
        {activeTodo &&
          new Date(activeTodo.startAt).toLocaleString()}{" "}
        →{" "}
        {activeTodo &&
          new Date(activeTodo.endAt).toLocaleString()}
      </p>
    </div>
  </DialogContent>
</Dialog>

    </>
  );
}
