package org.example.cad.service;

import org.example.cad.domain.model.VersionDoc;
import org.example.cad.repository.VersionRepository;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * VersionGraphService builds a DAG (Directed Acyclic Graph) of version history.
 * Each node in the graph represents a version; edges represent parent→child
 * relationships.
 */
@Service
public class VersionGraphService {

    private final VersionRepository versionRepository;

    public VersionGraphService(VersionRepository versionRepository) {
        this.versionRepository = versionRepository;
    }

    public Map<Integer, VersionDoc> buildGraph(String modelId) {
        List<VersionDoc> versions = versionRepository.findByModelId(modelId);
        Map<Integer, VersionDoc> graph = new LinkedHashMap<>();
        for (VersionDoc v : versions) {
            graph.put(v.getVersionNumber(), v);
        }
        return graph;
    }

    public List<VersionDoc> getBranchHistory(String modelId, String branchName) {
        return versionRepository.findByModelIdAndBranchName(modelId, branchName).stream()
                .sorted(Comparator.comparingInt(VersionDoc::getVersionNumber))
                .toList();
    }

    public VersionDoc getBranchHead(String modelId, String branchName) {
        List<VersionDoc> branch = getBranchHistory(modelId, branchName);
        return branch.isEmpty() ? null : branch.get(branch.size() - 1);
    }

    public int findCommonAncestor(String modelId, String branchA, String branchB) {
        Set<String> ancestorsA = new HashSet<>();
        List<VersionDoc> historyA = getBranchHistory(modelId, branchA);
        for (VersionDoc v : historyA) {
            if (v.getParentVersion() != null) {
                ancestorsA.add(v.getParentVersion());
            }
            ancestorsA.add(String.valueOf(v.getVersionNumber()));
        }

        List<VersionDoc> historyB = getBranchHistory(modelId, branchB);
        for (VersionDoc v : historyB) {
            if (ancestorsA.contains(String.valueOf(v.getVersionNumber()))) {
                return v.getVersionNumber();
            }
        }
        return -1;
    }
}
