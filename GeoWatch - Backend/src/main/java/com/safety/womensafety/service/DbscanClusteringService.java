package com.safety.womensafety.service;

import com.safety.womensafety.dto.ClusterResponse;
import com.safety.womensafety.model.Incident;
import com.safety.womensafety.util.GeoUtil;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DbscanClusteringService implements ClusteringService {

    private static final double EPS = 50.0; // 200 meters
    private static final int MIN_PTS = 2; // changed from 3 → 2

    @Override
    public List<ClusterResponse> performClustering(List<Incident> incidents) {

        List<ClusterResponse> clusters = new ArrayList<>();
        Set<Incident> visited = new HashSet<>();
        List<List<Incident>> dbscanClusters = new ArrayList<>();

        for (Incident incident : incidents) {

            if (visited.contains(incident)) {
                continue;
            }

            visited.add(incident);

            List<Incident> neighbors = regionQuery(incident, incidents);

            if (neighbors.size() < MIN_PTS) {
                continue; // still treated as noise by DBSCAN
            }

            List<Incident> cluster = new ArrayList<>();
            dbscanClusters.add(cluster);

            expandCluster(cluster, incident, neighbors, incidents, visited);
        }

        for (List<Incident> cluster : dbscanClusters) {

            double centerLat = averageLatitude(cluster);
            double centerLng = averageLongitude(cluster);
            int incidentCount = cluster.size();

            String riskLevel = determineRiskLevel(incidentCount);

            clusters.add(
                    new ClusterResponse(centerLat, centerLng, incidentCount, riskLevel)
            );
        }

        /*
        FALLBACK: if DBSCAN finds no clusters,
        show individual incidents so the dashboard
        still displays something.
         */

        if (clusters.isEmpty() && !incidents.isEmpty()) {

            for (Incident incident : incidents) {

                clusters.add(
                        new ClusterResponse(
                                incident.getLatitude(),
                                incident.getLongitude(),
                                1,
                                "LOW"
                        )
                );
            }
        }

        return clusters;
    }

    private List<Incident> regionQuery(Incident incident, List<Incident> incidents) {

        return incidents.stream()
                .filter(other ->
                        GeoUtil.calculateDistance(
                                incident.getLatitude(),
                                incident.getLongitude(),
                                other.getLatitude(),
                                other.getLongitude()
                        ) <= EPS
                )
                .collect(Collectors.toList());
    }

    private void expandCluster(
            List<Incident> cluster,
            Incident incident,
            List<Incident> neighbors,
            List<Incident> incidents,
            Set<Incident> visited
    ) {

        cluster.add(incident);

        for (int i = 0; i < neighbors.size(); i++) {

            Incident neighbor = neighbors.get(i);

            if (!visited.contains(neighbor)) {

                visited.add(neighbor);

                List<Incident> neighborNeighbors = regionQuery(neighbor, incidents);

                if (neighborNeighbors.size() >= MIN_PTS) {
                    neighbors.addAll(neighborNeighbors);
                }
            }

            if (!cluster.contains(neighbor)) {
                cluster.add(neighbor);
            }
        }
    }

    private double averageLatitude(List<Incident> cluster) {
        return cluster.stream()
                .mapToDouble(Incident::getLatitude)
                .average()
                .orElse(0.0);
    }

    private double averageLongitude(List<Incident> cluster) {
        return cluster.stream()
                .mapToDouble(Incident::getLongitude)
                .average()
                .orElse(0.0);
    }

    private String determineRiskLevel(int incidentCount) {

        if (incidentCount >= 6) {
            return "HIGH";
        } else if (incidentCount >= 3) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }
}