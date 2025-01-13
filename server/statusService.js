class StatusService {
  mapApiStatus(apiStatus) {
    switch (apiStatus) {
      case "Completed":
        return "completed";
      case "Processing":
      case "Pending":
      case "Staged":
        return "pending";
      case "Failed":
      default:
        return "error";
    }
  }

  formatTaskResponse(task) {
    if (!task) return null;

    const result = task.result ? JSON.parse(task.result) : null;
    
    return {
      taskId: task.taskId,
      status: task.currentStatus || 'pending',
      progress: task.progress || 0,
      imageUrl: result?.data?.output?.image_url || null,
      imageUrls: result?.data?.output?.image_urls || [],
      error: task.error || null
    };
  }
}

export default new StatusService();