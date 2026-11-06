resource "google_logging_metric" "api_errors" {
  name        = "showcaseme_api_errors"
  description = "Structured error events emitted by Showcaseme pods"
  filter      = <<-EOT
    resource.type="k8s_container"
    resource.labels.namespace_name="showcaseme"
    jsonPayload.level="error"
  EOT

  metric_descriptor {
    metric_kind  = "DELTA"
    value_type   = "INT64"
    unit         = "1"
    display_name = "Showcaseme API error events"
  }
}

resource "google_monitoring_alert_policy" "api_errors" {
  display_name = "Showcaseme - application errors"
  combiner     = "OR"
  enabled      = true
  documentation {
    content   = "Investigate API and workload logs in namespace showcaseme. Check recent releases, API errors and Cloud SQL connectivity."
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "More than five application errors in five minutes"
    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND metric.type=\"logging.googleapis.com/user/showcaseme_api_errors\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      duration        = "300s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_SUM"
        cross_series_reducer = "REDUCE_SUM"
      }
      trigger {
        count = 1
      }
    }
  }
}

resource "google_monitoring_alert_policy" "pod_restarts" {
  display_name = "Showcaseme - elevated pod restarts"
  combiner     = "OR"
  enabled      = true
  documentation {
    content   = "Review Kubernetes events, resource limits, container logs and recent rollout history in namespace showcaseme."
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "More than three container restarts in five minutes"
    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND metric.type=\"kubernetes.io/container/restart_count\" AND resource.labels.namespace_name=\"showcaseme\""
      comparison      = "COMPARISON_GT"
      threshold_value = 3
      duration        = "300s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.namespace_name"]
      }
      trigger {
        count = 1
      }
    }
  }
}

resource "google_monitoring_alert_policy" "https_latency" {
  display_name = "Showcaseme - HTTPS backend latency"
  combiner     = "OR"
  enabled      = true
  documentation {
    content   = "Inspect GKE ingress backend health, API latency, Cloud SQL query performance, HPA and node capacity."
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "HTTPS backend p95 latency above one second"
    condition_threshold {
      filter          = "resource.type=\"https_lb_rule\" AND metric.type=\"loadbalancing.googleapis.com/https/backend_latencies\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1000
      duration        = "300s"
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_PERCENTILE_95"
        group_by_fields      = ["resource.label.backend_target_name"]
      }
      trigger {
        count = 1
      }
    }
  }
}
