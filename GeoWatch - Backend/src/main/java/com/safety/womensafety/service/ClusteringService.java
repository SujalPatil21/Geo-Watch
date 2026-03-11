package com.safety.womensafety.service;

import com.safety.womensafety.dto.ClusterResponse;
import com.safety.womensafety.model.Incident;
import java.util.List;

public interface ClusteringService {
    List<ClusterResponse> performClustering(List<Incident> incidents);
}
