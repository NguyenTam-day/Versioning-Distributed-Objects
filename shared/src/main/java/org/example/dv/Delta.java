package org.example.dv;

/**
 * Very small Delta representation for demo: a compact patch string and its byte size.
 */
public class Delta {
    private final String patch;
    private final int sizeBytes;

    public Delta(String patch, int sizeBytes) {
        this.patch = patch;
        this.sizeBytes = sizeBytes;
    }

    public String getPatch() {
        return patch;
    }

    public int getSizeBytes() {
        return sizeBytes;
    }
}

