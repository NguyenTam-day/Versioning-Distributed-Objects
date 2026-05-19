package org.example;

import org.example.dv.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Demo that simulates two sites checking out the same CAD object, creating conflicts,
 * and compares storage for full snapshots vs delta storage over 10 versions.
 */
public class MainDemo {
    public static void main(String[] args) {
        String initial = "PART:box\nvertices:\n(0,0,0)\n(1,0,0)\n(1,1,0)\n(0,1,0)\n";
        CadModel model = new CadModel("part-1", initial);

        // create initial snapshot version
        Version root = new Version(id(), null, now(), "user0", true, initial, null, "main");
        model.addVersion(root);

        // Simulate two sites both checking out root
        String siteAGeo = modify(initial, "A");
        String siteBGeo = modify(initial, "B");

        Version a = new Version(id(), root.getId(), now(), "siteA", true, siteAGeo, null, "branch-A");
        Version b = new Version(id(), root.getId(), now()+1, "siteB", true, siteBGeo, null, "branch-B");

        List<Version> resolvedBranch = ConflictResolver.resolve(List.of(a, b), ConflictResolutionStrategy.BRANCH);
        System.out.println("BRANCH resolution kept " + resolvedBranch.size() + " versions: ");
        resolvedBranch.forEach(v -> System.out.println(" - " + v.getId() + " by " + v.getAuthor() + " branch=" + v.getBranchId()));

        List<Version> resolvedLWW = ConflictResolver.resolve(List.of(a, b), ConflictResolutionStrategy.TIMESTAMP);
        System.out.println("TIMESTAMP resolution kept " + resolvedLWW.size() + " version: " + resolvedLWW.get(0).getId());

        // Now a storage metric demo for 10 incremental versions where each version has a small edit
        // We'll build versions where we store either full snapshots every time or deltas against previous
        String base = initial;
        List<String> allVersions = new ArrayList<>();
        allVersions.add(base);
        for (int i = 1; i < 10; i++) {
            base = modify(base, "v" + i);
            allVersions.add(base);
        }

        int fullTotal = 0;
        for (String s : allVersions) fullTotal += s.getBytes().length;

        int deltaTotal = allVersions.get(0).getBytes().length; // store initial full snapshot
        for (int i = 1; i < allVersions.size(); i++) {
            Delta d = DeltaUtil.createDelta(allVersions.get(i - 1), allVersions.get(i));
            deltaTotal += d.getSizeBytes();
        }

        System.out.println("Storage for " + allVersions.size() + " versions:");
        System.out.println(" - Full snapshots total bytes: " + fullTotal);
        System.out.println(" - Delta storage total bytes: " + deltaTotal + " (initial snapshot + deltas)");
    }

    private static String id() {
        return UUID.randomUUID().toString();
    }

    private static long now() {
        return System.currentTimeMillis();
    }

    private static String modify(String base, String tag) {
        // naive modification: append a small line indicating a change
        return base + "#mod:" + tag + "\n";
    }
}

