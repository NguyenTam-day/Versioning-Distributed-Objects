package org.example.dv;

/**
 * Naive delta util for demo purposes.
 * - createDelta: finds longest common prefix/suffix and stores the middle replacement and offsets
 * - applyDelta: applies the stored patch to a base string
 */
public class DeltaUtil {

    public static Delta createDelta(String base, String modified) {
        if (base == null) base = "";
        if (modified == null) modified = "";
        if (base.equals(modified)) return new Delta("", 0);

        int prefix = 0;
        int minLen = Math.min(base.length(), modified.length());
        while (prefix < minLen && base.charAt(prefix) == modified.charAt(prefix)) {
            prefix++;
        }

        int suffix = 0;
        while (suffix < (base.length() - prefix) && suffix < (modified.length() - prefix)
                && base.charAt(base.length() - 1 - suffix) == modified.charAt(modified.length() - 1 - suffix)) {
            suffix++;
        }

        String removed = base.substring(prefix, base.length() - suffix);
        String added = modified.substring(prefix, modified.length() - suffix);
        // patch format: prefix|removed|added|suffixCount
        String patch = prefix + "|" + removed + "|" + added + "|" + suffix;
        int size = patch.getBytes().length;
        return new Delta(patch, size);
    }

    public static String applyDelta(String base, Delta delta) {
        if (delta == null) return base;
        if (base == null) base = "";
        String patch = delta.getPatch();
        if (patch == null || patch.isEmpty()) return base;
        String[] parts = patch.split("\\|", -1);
        if (parts.length != 4) return base; // malformed -> return base
        int prefix = Integer.parseInt(parts[0]);
        // String removed = parts[1]; not used for apply
        String added = parts[2];
        int suffix = Integer.parseInt(parts[3]);

        StringBuilder sb = new StringBuilder();
        if (prefix > 0) sb.append(base, 0, Math.min(prefix, base.length()));
        if (added != null && !added.isEmpty()) sb.append(added);
        if (suffix > 0 && base.length() - suffix >= prefix) sb.append(base, base.length() - suffix, base.length());
        return sb.toString();
    }
}

