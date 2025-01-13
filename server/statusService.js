class StatusService {
  mapApiStatus(apiStatus) {
    switch (apiStatus) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "error":
      default:
        return "Failed";
    }
  }

  convertToISOString(timestamp) {
    if (!timestamp) return null;
    // Handle both Date objects and Firestore Timestamps
    return timestamp.toDate ? timestamp.toDate().toISOString() : timestamp.toISOString();
  }

  formatTaskResponse(task) {
    if (!task) return null;

    const now = new Date().toISOString();
    const result = task.result ? JSON.parse(task.result) : null;
    const output = result?.data?.output || {};
    
    return {
      task_id: task.taskId,
      model: "midjourney",
      task_type: "imagine",
      status: this.mapApiStatus(task.currentStatus || 'pending'),
      config: {
        service_mode: "private",
        webhook_config: {
          endpoint: "",
          secret: ""
        }
      },
      input: {
        prompt: task.prompt || "",
        aspect_ratio: task.aspectRatio || "1:1",
        process_mode: "fast",
        skip_prompt_check: false,
        bot_id: 0
      },
      output: {
        image_url: output.image_url || "",
        image_urls: output.image_urls || [],
        temporary_image_urls: [],
        discord_image_url: "",
        actions: [],
        progress: task.progress || 0,
        intermediate_image_urls: null
      },
      meta: {
        created_at: this.convertToISOString(task.createdAt) || now,
        started_at: this.convertToISOString(task.startedAt) || now,
        ended_at: this.convertToISOString(task.completedAt) || now,
        usage: {
          type: "mj",
          frozen: 0,
          consume: 0
        },
        is_using_private_pool: true,
        model_version: "v6",
        process_mode: "fast",
        failover_triggered: false
      },
      detail: null,
      logs: [],
      error: {
        code: 0,
        raw_message: "",
        message: "",
        detail: null
      }
    };
  }
}

export default new StatusService();