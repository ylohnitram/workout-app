"use client"
import { useWorkout } from "../../contexts/WorkoutContext"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Card, CardContent } from "@/components/ui/card"

const days = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]

export default function WeekPlanner() {
  const { workouts, weekPlan, updateWeekPlan } = useWorkout()

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId === "workouts" && destination.droppableId.startsWith("day-")) {
      const day = days[Number.parseInt(destination.droppableId.split("-")[1])]
      updateWeekPlan(day, draggableId)
    } else if (source.droppableId.startsWith("day-") && destination.droppableId === "workouts") {
      const day = days[Number.parseInt(source.droppableId.split("-")[1])]
      updateWeekPlan(day, "")
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex space-x-4">
        <Droppable droppableId="workouts">
          {(provided) => (
            <Card className="w-1/3">
              <CardContent {...provided.droppableProps} ref={provided.innerRef} className="p-4">
                <h3 className="font-bold mb-2">Dostupné tréninky</h3>
                {workouts.map((workout, index) => (
                  <Draggable key={workout.id} draggableId={workout.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white p-2 mb-2 rounded border"
                      >
                        {workout.name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </CardContent>
            </Card>
          )}
        </Droppable>
        <Card className="w-2/3">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">Týdenní plán</h3>
            {days.map((day, index) => (
              <Droppable key={day} droppableId={`day-${index}`}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex items-center space-x-4 mb-2 bg-gray-100 p-2 rounded"
                  >
                    <span className="w-24">{day}:</span>
                    <div className="flex-grow bg-white p-2 rounded min-h-[40px]">
                      {weekPlan[day] && (
                        <Draggable draggableId={weekPlan[day]} index={0}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-blue-100 p-1 rounded"
                            >
                              {workouts.find((w) => w.id === weekPlan[day])?.name}
                            </div>
                          )}
                        </Draggable>
                      )}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </CardContent>
        </Card>
      </div>
    </DragDropContext>
  )
}

